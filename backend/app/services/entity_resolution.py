import logging
from typing import Any
from collections import defaultdict

from sqlalchemy import select, update, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from rapidfuzz import fuzz

from app.database import AsyncSessionLocal
from app.models.hpd import RegistrationContact
from app.models.owner import OwnerPortfolio

logger = logging.getLogger(__name__)


class EntityResolutionService:
    """Service for resolving owner entities and creating portfolios."""

    FUZZY_THRESHOLD = 85  # Minimum similarity score for fuzzy matching

    async def run_entity_resolution(self):
        """
        Main entity resolution process:
        1. Group contacts by exact hash match
        2. Create portfolios from hash groups
        3. Link contact records with portfolio IDs
        
        Note: Fuzzy matching is available but skipped for initial load speed.
        Can be run separately with run_fuzzy_merge() later.
        """
        logger.info("Starting entity resolution")

        async with AsyncSessionLocal() as session:
            # Step 1: Get distinct owner hashes with their contacts
            hash_groups = await self._get_hash_groups(session)
            logger.info(f"Found {len(hash_groups)} distinct owner hash groups")

            # Step 2: Create portfolios from hash groups
            created_count = await self._create_portfolios_from_groups(session, hash_groups)
            logger.info(f"Created {created_count} portfolios")

            # Step 3: Link contacts to portfolios (fast bulk SQL)
            await self._link_contacts_to_portfolios(session)
            logger.info("Linked contacts to portfolios")

            await session.commit()

        logger.info("Entity resolution complete")

    async def _get_hash_groups(
        self, session: AsyncSession
    ) -> dict[str, list[dict[str, Any]]]:
        """Group contacts by name_hash."""
        query = select(
            RegistrationContact.name_hash,
            RegistrationContact.full_name,
            RegistrationContact.normalized_name,
            RegistrationContact.normalized_address,
            RegistrationContact.business_address,
            RegistrationContact.corporation_name,
            func.count(RegistrationContact.id).label("contact_count"),
        ).where(
            RegistrationContact.name_hash.isnot(None),
            RegistrationContact.contact_type.in_(["Owner", "HeadOfficer", "IndividualOwner"]),
        ).group_by(
            RegistrationContact.name_hash,
            RegistrationContact.full_name,
            RegistrationContact.normalized_name,
            RegistrationContact.normalized_address,
            RegistrationContact.business_address,
            RegistrationContact.corporation_name,
        )

        result = await session.execute(query)

        groups = defaultdict(list)
        for row in result:
            groups[row.name_hash].append({
                "full_name": row.full_name,
                "normalized_name": row.normalized_name,
                "normalized_address": row.normalized_address,
                "business_address": row.business_address,
                "corporation_name": row.corporation_name,
                "contact_count": row.contact_count,
            })

        return dict(groups)

    async def _create_portfolios_from_groups(
        self,
        session: AsyncSession,
        hash_groups: dict[str, list[dict[str, Any]]],
    ) -> int:
        """Create portfolio records from hash groups."""
        # Fetch existing hashes so reruns are idempotent.
        existing_hashes = set(
            (await session.execute(select(OwnerPortfolio.name_hash)))
            .scalars()
            .all()
        )

        portfolios: list[OwnerPortfolio] = []

        for name_hash, contacts in hash_groups.items():
            if name_hash in existing_hashes:
                continue

            # Use the contact with most occurrences as primary
            primary = max(contacts, key=lambda c: c["contact_count"])

            is_llc = 1 if self._is_llc_name(primary["full_name"]) else 0

            portfolio = OwnerPortfolio(
                primary_name=primary["full_name"],
                normalized_name=primary["normalized_name"],
                name_hash=name_hash,
                primary_address=primary["business_address"],
                normalized_address=primary["normalized_address"],
                is_llc=is_llc,
            )

            session.add(portfolio)
            portfolios.append(portfolio)

        await session.flush()
        return len(portfolios)

    async def _fuzzy_merge_portfolios(
        self,
        session: AsyncSession,
        portfolios: list[OwnerPortfolio],
    ) -> list[OwnerPortfolio]:
        """Merge portfolios with similar names using fuzzy matching with blocking."""
        # Build index of normalized names with blocking by first 4 chars
        # This reduces O(n²) to O(n * bucket_size²) which is much faster
        buckets = defaultdict(list)
        for p in portfolios:
            if p.normalized_name and len(p.normalized_name) >= 4:
                # Use first 4 chars as blocking key
                block_key = p.normalized_name[:4].lower()
                buckets[block_key].append(p)
            elif p.normalized_name:
                # Short names go in their own bucket
                buckets[p.normalized_name.lower()].append(p)
        
        logger.info(f"Created {len(buckets)} blocking buckets for fuzzy matching")
        
        # Find similar names within each bucket and merge
        merged_ids = set()
        merge_map = {}  # Maps merged portfolio ID to target portfolio
        
        bucket_count = 0
        for block_key, bucket_portfolios in buckets.items():
            bucket_count += 1
            if bucket_count % 1000 == 0:
                logger.info(f"Processing bucket {bucket_count}/{len(buckets)}")
            
            # Skip buckets with only one portfolio
            if len(bucket_portfolios) <= 1:
                continue
            
            # Sort by normalized name for consistent comparison
            sorted_portfolios = sorted(bucket_portfolios, key=lambda p: p.normalized_name or "")
            
            for i, p1 in enumerate(sorted_portfolios):
                if p1.id in merged_ids:
                    continue
                
                name1 = p1.normalized_name or ""
                
                for p2 in sorted_portfolios[i + 1:]:
                    if p2.id in merged_ids:
                        continue
                    
                    name2 = p2.normalized_name or ""
                    
                    # Check fuzzy similarity
                    similarity = fuzz.ratio(name1, name2)
                    if similarity >= self.FUZZY_THRESHOLD:
                        # Merge p2 into p1
                        merge_map[p2.id] = p1.id
                        merged_ids.add(p2.id)

        logger.info(f"Found {len(merge_map)} portfolios to merge")
        
        # Batch update merged portfolios to point to targets
        if merge_map:
            # Process in batches to avoid memory issues
            batch_size = 1000
            items = list(merge_map.items())
            for i in range(0, len(items), batch_size):
                batch = items[i:i + batch_size]
                for source_id, target_id in batch:
                    await session.execute(
                        update(RegistrationContact)
                        .where(RegistrationContact.owner_portfolio_id == source_id)
                        .values(owner_portfolio_id=target_id)
                    )
                    # Delete merged portfolio
                    portfolio = await session.get(OwnerPortfolio, source_id)
                    if portfolio:
                        await session.delete(portfolio)
                
                if i + batch_size < len(items):
                    logger.info(f"Processed merge batch {i + batch_size}/{len(items)}")

        # Return remaining portfolios
        return [p for p in portfolios if p.id not in merged_ids]

    async def _link_contacts_to_portfolios(self, session: AsyncSession):
        """Update contacts with their portfolio IDs based on name_hash."""
        await session.execute(
            text("""
                UPDATE registration_contacts rc
                SET owner_portfolio_id = op.id
                FROM owner_portfolios op
                WHERE rc.name_hash = op.name_hash
                AND rc.owner_portfolio_id IS NULL
            """)
        )

    @staticmethod
    def _is_llc_name(name: str | None) -> bool:
        """Check if name appears to be an LLC or corporate entity."""
        if not name:
            return False
        name_upper = name.upper()
        indicators = ["LLC", "L.L.C.", "INC", "CORP", "LP", "L.P.", "LTD", "PLLC"]
        return any(ind in name_upper for ind in indicators)

    async def update_portfolio_stats(self):
        """Update portfolio statistics after scoring is complete."""
        async with AsyncSessionLocal() as session:
            await session.execute(
                text("""
                    UPDATE owner_portfolios op
                    SET
                        total_buildings = stats.building_count,
                        total_units = stats.unit_count,
                        total_violations = stats.violation_count,
                        class_c_violations = stats.class_c_count,
                        class_b_violations = stats.class_b_count,
                        class_a_violations = stats.class_a_count
                    FROM (
                        SELECT
                            rc.owner_portfolio_id,
                            COUNT(DISTINCT r.bbl) as building_count,
                            COALESCE(SUM(b.total_units), 0) as unit_count,
                            COALESCE(SUM(bs.total_violations), 0) as violation_count,
                            COALESCE(SUM(bs.class_c_violations), 0) as class_c_count,
                            COALESCE(SUM(bs.class_b_violations), 0) as class_b_count,
                            COALESCE(SUM(bs.class_a_violations), 0) as class_a_count
                        FROM registration_contacts rc
                        JOIN hpd_registrations r ON rc.registration_id = r.registration_id
                        LEFT JOIN buildings b ON r.bbl = b.bbl
                        LEFT JOIN building_scores bs ON r.bbl = bs.bbl
                        WHERE rc.owner_portfolio_id IS NOT NULL
                        GROUP BY rc.owner_portfolio_id
                    ) stats
                    WHERE op.id = stats.owner_portfolio_id
                """)
            )
            await session.commit()
