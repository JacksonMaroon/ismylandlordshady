import logging
from datetime import datetime

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.database import AsyncSessionLocal
from app.models.building import Building
from app.models.hpd import HPDViolation
from app.models.complaints import Complaint311
from app.models.eviction import Eviction
from app.models.score import BuildingScore
from app.models.owner import OwnerPortfolio

logger = logging.getLogger(__name__)


class ScoringService:
    """
    Service for computing building and landlord scores.

    Scoring Formula:
    overall_score = (
        violation_score * 0.30 +      # Class C=10pts, B=5pts, A=1pt per unit
        complaints_score * 0.20 +      # 311 complaints per unit × 20
        eviction_score * 0.25 +        # Eviction filings per unit × 50
        ownership_score * 0.15 +       # LLC + portfolio size flags
        resolution_score * 0.10        # Days to resolve vs city avg
    )

    Grade: A (0-19), B (20-39), C (40-59), D (60-79), F (80-100)
    """

    # Score weights
    VIOLATION_WEIGHT = 0.30
    COMPLAINTS_WEIGHT = 0.20
    EVICTION_WEIGHT = 0.25
    OWNERSHIP_WEIGHT = 0.15
    RESOLUTION_WEIGHT = 0.10

    # Points per violation class
    CLASS_C_POINTS = 10
    CLASS_B_POINTS = 5
    CLASS_A_POINTS = 1

    # Multipliers for per-unit calculations
    COMPLAINTS_MULTIPLIER = 20
    EVICTION_MULTIPLIER = 50

    # City average resolution time (days) - approximate
    CITY_AVG_RESOLUTION_DAYS = 30

    async def compute_all_scores(self):
        """Compute scores for all buildings using set-based SQL."""
        logger.info("Starting score computation (set-based)")
        start = datetime.now()

        score_sql = text(
            """
            WITH building_base AS (
                SELECT
                    bbl,
                    GREATEST(COALESCE(total_units, 1), 1) AS units
                FROM buildings
            ),
            violation_counts AS (
                SELECT
                    bbl,
                    SUM(CASE WHEN violation_class = 'C' THEN 1 ELSE 0 END) AS class_c,
                    SUM(CASE WHEN violation_class = 'B' THEN 1 ELSE 0 END) AS class_b,
                    SUM(CASE WHEN violation_class = 'A' THEN 1 ELSE 0 END) AS class_a,
                    SUM(CASE WHEN current_status IN ('OPEN', 'NOV SENT') THEN 1 ELSE 0 END) AS open_violations,
                    COUNT(*) AS total_violations
                FROM hpd_violations
                WHERE bbl IS NOT NULL
                GROUP BY bbl
            ),
            complaint_counts AS (
                SELECT
                    bbl,
                    COUNT(*) AS total_complaints,
                    AVG(days_to_resolve)::float AS avg_resolution_days
                FROM complaints_311
                WHERE bbl IS NOT NULL
                GROUP BY bbl
            ),
            eviction_counts AS (
                SELECT
                    bbl,
                    COUNT(*) AS total_evictions
                FROM evictions
                WHERE bbl IS NOT NULL
                GROUP BY bbl
            ),
            portfolio_buildings AS (
                SELECT
                    rc.owner_portfolio_id,
                    COUNT(DISTINCT hr.bbl) AS total_buildings
                FROM registration_contacts rc
                JOIN hpd_registrations hr ON rc.registration_id = hr.registration_id
                WHERE rc.owner_portfolio_id IS NOT NULL
                GROUP BY rc.owner_portfolio_id
            ),
            ownership_info AS (
                SELECT
                    hr.bbl,
                    MAX(op.is_llc) AS is_llc,
                    MAX(pb.total_buildings) AS total_buildings
                FROM registration_contacts rc
                JOIN hpd_registrations hr ON rc.registration_id = hr.registration_id
                JOIN owner_portfolios op ON rc.owner_portfolio_id = op.id
                JOIN portfolio_buildings pb ON pb.owner_portfolio_id = op.id
                WHERE rc.contact_type = 'Owner'
                GROUP BY hr.bbl
            ),
            scored AS (
                SELECT
                    b.bbl,
                    b.units,
                    COALESCE(v.total_violations, 0) AS total_violations,
                    COALESCE(v.class_c, 0) AS class_c,
                    COALESCE(v.class_b, 0) AS class_b,
                    COALESCE(v.class_a, 0) AS class_a,
                    COALESCE(v.open_violations, 0) AS open_violations,
                    COALESCE(c.total_complaints, 0) AS total_complaints,
                    COALESCE(e.total_evictions, 0) AS total_evictions,
                    c.avg_resolution_days,
                    COALESCE(o.is_llc, 0) AS is_llc,
                    COALESCE(o.total_buildings, 0) AS total_buildings
                FROM building_base b
                LEFT JOIN violation_counts v ON b.bbl = v.bbl
                LEFT JOIN complaint_counts c ON b.bbl = c.bbl
                LEFT JOIN eviction_counts e ON b.bbl = e.bbl
                LEFT JOIN ownership_info o ON b.bbl = o.bbl
            ),
            computed AS (
                SELECT
                    bbl,
                    units,
                    total_violations,
                    class_c,
                    class_b,
                    class_a,
                    open_violations,
                    total_complaints,
                    total_evictions,
                    avg_resolution_days,
                    LEAST(((class_c * 10 + class_b * 5 + class_a)::float / units) * 10, 100) AS violation_score,
                    LEAST((total_complaints::float / units) * 20, 100) AS complaints_score,
                    LEAST((total_evictions::float / units) * 50, 100) AS eviction_score,
                    LEAST(
                        (CASE WHEN is_llc = 1 THEN 30 ELSE 0 END) +
                        (CASE
                            WHEN total_buildings >= 100 THEN 70
                            WHEN total_buildings >= 50 THEN 50
                            WHEN total_buildings >= 20 THEN 30
                            WHEN total_buildings >= 10 THEN 15
                            ELSE 0
                        END),
                        100
                    ) AS ownership_score,
                    CASE
                        WHEN avg_resolution_days IS NULL OR avg_resolution_days <= 30 THEN 0
                        ELSE LEAST((avg_resolution_days - 30) * 2, 100)
                    END AS resolution_score
                FROM scored
            ),
            final AS (
                SELECT
                    bbl,
                    total_violations,
                    class_c,
                    class_b,
                    class_a,
                    open_violations,
                    total_complaints,
                    total_evictions,
                    avg_resolution_days,
                    violation_score,
                    complaints_score,
                    eviction_score,
                    ownership_score,
                    resolution_score,
                    LEAST(
                        violation_score * 0.30 +
                        complaints_score * 0.20 +
                        eviction_score * 0.25 +
                        ownership_score * 0.15 +
                        resolution_score * 0.10,
                        100
                    ) AS overall_score,
                    (total_violations::float / units) AS violations_per_unit,
                    (total_complaints::float / units) AS complaints_per_unit,
                    (total_evictions::float / units) AS evictions_per_unit
                FROM computed
            )
            INSERT INTO building_scores (
                bbl,
                violation_score,
                complaints_score,
                eviction_score,
                ownership_score,
                resolution_score,
                overall_score,
                grade,
                total_violations,
                class_c_violations,
                class_b_violations,
                class_a_violations,
                open_violations,
                total_complaints,
                total_evictions,
                avg_resolution_days,
                violations_per_unit,
                complaints_per_unit,
                evictions_per_unit,
                created_at,
                updated_at
            )
            SELECT
                bbl,
                ROUND(violation_score::numeric, 2),
                ROUND(complaints_score::numeric, 2),
                ROUND(eviction_score::numeric, 2),
                ROUND(ownership_score::numeric, 2),
                ROUND(resolution_score::numeric, 2),
                ROUND(overall_score::numeric, 2),
                CASE
                    WHEN overall_score < 20 THEN 'A'
                    WHEN overall_score < 40 THEN 'B'
                    WHEN overall_score < 60 THEN 'C'
                    WHEN overall_score < 80 THEN 'D'
                    ELSE 'F'
                END,
                total_violations,
                class_c,
                class_b,
                class_a,
                open_violations,
                total_complaints,
                total_evictions,
                avg_resolution_days,
                ROUND(violations_per_unit::numeric, 2),
                ROUND(complaints_per_unit::numeric, 2),
                ROUND(evictions_per_unit::numeric, 2),
                NOW(),
                NOW()
            FROM final
            ON CONFLICT (bbl) DO UPDATE SET
                violation_score = EXCLUDED.violation_score,
                complaints_score = EXCLUDED.complaints_score,
                eviction_score = EXCLUDED.eviction_score,
                ownership_score = EXCLUDED.ownership_score,
                resolution_score = EXCLUDED.resolution_score,
                overall_score = EXCLUDED.overall_score,
                grade = EXCLUDED.grade,
                total_violations = EXCLUDED.total_violations,
                class_c_violations = EXCLUDED.class_c_violations,
                class_b_violations = EXCLUDED.class_b_violations,
                class_a_violations = EXCLUDED.class_a_violations,
                open_violations = EXCLUDED.open_violations,
                total_complaints = EXCLUDED.total_complaints,
                total_evictions = EXCLUDED.total_evictions,
                avg_resolution_days = EXCLUDED.avg_resolution_days,
                violations_per_unit = EXCLUDED.violations_per_unit,
                complaints_per_unit = EXCLUDED.complaints_per_unit,
                evictions_per_unit = EXCLUDED.evictions_per_unit,
                updated_at = NOW()
            """
        )

        async with AsyncSessionLocal() as session:
            await session.execute(text("TRUNCATE building_scores"))
            await session.execute(score_sql)
            await session.commit()

            # Compute percentiles
            await self._compute_percentiles(session)
            await session.commit()

        # Update portfolio stats and scores after building scores are computed
        from app.services.entity_resolution import EntityResolutionService

        await EntityResolutionService().update_portfolio_stats()
        await self.compute_portfolio_scores()

        elapsed = (datetime.now() - start).total_seconds()
        logger.info(f"Score computation complete in {elapsed:.1f}s")

    async def _get_buildings_with_units(self, session: AsyncSession) -> list[Building]:
        """Get all buildings to score."""
        # Score all buildings - unit counts may be 0/NULL in HPD data
        query = select(Building)
        result = await session.execute(query)
        return result.scalars().all()

    async def _compute_building_score(
        self, session: AsyncSession, building: Building
    ) -> dict | None:
        """Compute all score components for a building."""
        bbl = building.bbl
        units = max(building.total_units or 1, 1)

        # Get violation counts
        violation_counts = await self._get_violation_counts(session, bbl)
        total_violations = sum(violation_counts.values())
        open_violations = await self._get_open_violation_count(session, bbl)

        # Get complaint count
        complaint_count = await self._get_complaint_count(session, bbl)

        # Get eviction count
        eviction_count = await self._get_eviction_count(session, bbl)

        # Get average resolution time
        avg_resolution = await self._get_avg_resolution_time(session, bbl)

        # Compute component scores
        violation_score = self._compute_violation_score(violation_counts, units)
        complaints_score = self._compute_complaints_score(complaint_count, units)
        eviction_score = self._compute_eviction_score(eviction_count, units)
        ownership_score = await self._compute_ownership_score(session, bbl)
        resolution_score = float(self._compute_resolution_score(avg_resolution))

        # Compute overall score (0-100 scale, higher is worse)
        overall_score = (
            violation_score * self.VIOLATION_WEIGHT +
            complaints_score * self.COMPLAINTS_WEIGHT +
            eviction_score * self.EVICTION_WEIGHT +
            ownership_score * self.OWNERSHIP_WEIGHT +
            resolution_score * self.RESOLUTION_WEIGHT
        )

        # Cap at 100
        overall_score = min(overall_score, 100)

        # Determine grade
        grade = self._score_to_grade(overall_score)

        return {
            "bbl": bbl,
            "violation_score": round(violation_score, 2),
            "complaints_score": round(complaints_score, 2),
            "eviction_score": round(eviction_score, 2),
            "ownership_score": round(ownership_score, 2),
            "resolution_score": round(resolution_score, 2),
            "overall_score": round(overall_score, 2),
            "grade": grade,
            "total_violations": total_violations,
            "class_c_violations": violation_counts.get("C", 0),
            "class_b_violations": violation_counts.get("B", 0),
            "class_a_violations": violation_counts.get("A", 0),
            "open_violations": open_violations,
            "total_complaints": complaint_count,
            "total_evictions": eviction_count,
            "avg_resolution_days": avg_resolution,
            "violations_per_unit": round(total_violations / units, 2),
            "complaints_per_unit": round(complaint_count / units, 2),
            "evictions_per_unit": round(eviction_count / units, 2),
        }

    async def _get_violation_counts(
        self, session: AsyncSession, bbl: str
    ) -> dict[str, int]:
        """Get violation counts by class for a building."""
        query = (
            select(
                HPDViolation.violation_class,
                func.count(HPDViolation.violation_id),
            )
            .where(HPDViolation.bbl == bbl)
            .group_by(HPDViolation.violation_class)
        )
        result = await session.execute(query)

        counts = {"A": 0, "B": 0, "C": 0}
        for row in result:
            if row[0] in counts:
                counts[row[0]] = row[1]

        return counts

    async def _get_open_violation_count(
        self, session: AsyncSession, bbl: str
    ) -> int:
        """Get count of open violations for a building."""
        query = (
            select(func.count(HPDViolation.violation_id))
            .where(
                HPDViolation.bbl == bbl,
                HPDViolation.current_status.in_(["OPEN", "NOV SENT"]),
            )
        )
        result = await session.execute(query)
        return result.scalar() or 0

    async def _get_complaint_count(self, session: AsyncSession, bbl: str) -> int:
        """Get 311 complaint count for a building."""
        query = (
            select(func.count(Complaint311.unique_key))
            .where(Complaint311.bbl == bbl)
        )
        result = await session.execute(query)
        return result.scalar() or 0

    async def _get_eviction_count(self, session: AsyncSession, bbl: str) -> int:
        """Get eviction count for a building."""
        query = (
            select(func.count(Eviction.id))
            .where(Eviction.bbl == bbl)
        )
        result = await session.execute(query)
        return result.scalar() or 0

    async def _get_avg_resolution_time(
        self, session: AsyncSession, bbl: str
    ) -> float | None:
        """Get average complaint resolution time in days."""
        query = (
            select(func.avg(Complaint311.days_to_resolve))
            .where(
                Complaint311.bbl == bbl,
                Complaint311.days_to_resolve.isnot(None),
                Complaint311.days_to_resolve > 0,
            )
        )
        result = await session.execute(query)
        return result.scalar()

    def _compute_violation_score(
        self, counts: dict[str, int], units: int
    ) -> float:
        """
        Compute violation score.
        Class C = 10 points, B = 5 points, A = 1 point, per unit.
        """
        raw_points = (
            counts.get("C", 0) * self.CLASS_C_POINTS +
            counts.get("B", 0) * self.CLASS_B_POINTS +
            counts.get("A", 0) * self.CLASS_A_POINTS
        )
        # Normalize to per-unit and scale to 0-100
        per_unit = raw_points / units
        # Cap at reasonable maximum (e.g., 10 points per unit = 100 score)
        return min(per_unit * 10, 100)

    def _compute_complaints_score(self, count: int, units: int) -> float:
        """
        Compute complaints score.
        Complaints per unit × 20, capped at 100.
        """
        per_unit = count / units
        return min(per_unit * self.COMPLAINTS_MULTIPLIER, 100)

    def _compute_eviction_score(self, count: int, units: int) -> float:
        """
        Compute eviction score.
        Evictions per unit × 50, capped at 100.
        """
        per_unit = count / units
        return min(per_unit * self.EVICTION_MULTIPLIER, 100)

    async def _compute_ownership_score(
        self, session: AsyncSession, bbl: str
    ) -> float:
        """
        Compute ownership score based on:
        - LLC usage (30 points)
        - Large portfolio size (up to 70 points based on size)
        """
        score = 0

        # Check if owner uses LLC
        query = text("""
            SELECT op.is_llc, op.total_buildings
            FROM registration_contacts rc
            JOIN hpd_registrations hr ON rc.registration_id = hr.registration_id
            JOIN owner_portfolios op ON rc.owner_portfolio_id = op.id
            WHERE hr.bbl = :bbl
            AND rc.contact_type = 'Owner'
            LIMIT 1
        """)
        result = await session.execute(query, {"bbl": bbl})
        row = result.first()

        if row:
            if row.is_llc:
                score += 30

            # Portfolio size scoring: larger portfolios get higher scores
            if row.total_buildings:
                if row.total_buildings >= 100:
                    score += 70
                elif row.total_buildings >= 50:
                    score += 50
                elif row.total_buildings >= 20:
                    score += 30
                elif row.total_buildings >= 10:
                    score += 15

        return min(score, 100)

    def _compute_resolution_score(self, avg_days: float | None) -> float:
        """
        Compute resolution score based on average resolution time.
        Score increases as resolution time exceeds city average.
        """
        if avg_days is None:
            return 0

        if avg_days <= self.CITY_AVG_RESOLUTION_DAYS:
            return 0

        # Score based on how much slower than average
        excess_days = avg_days - self.CITY_AVG_RESOLUTION_DAYS
        # Every 10 excess days = 20 points, capped at 100
        return min((excess_days / 10) * 20, 100)

    @staticmethod
    def _score_to_grade(score: float) -> str:
        """Convert numeric score to letter grade."""
        if score < 20:
            return "A"
        elif score < 40:
            return "B"
        elif score < 60:
            return "C"
        elif score < 80:
            return "D"
        else:
            return "F"

    async def _upsert_scores(
        self, session: AsyncSession, scores: list[dict]
    ):
        """Upsert score records."""
        stmt = insert(BuildingScore.__table__).values(scores)
        stmt = stmt.on_conflict_do_update(
            index_elements=["bbl"],
            set_={
                col.name: stmt.excluded[col.name]
                for col in BuildingScore.__table__.columns
                if col.name != "bbl"
            },
        )
        await session.execute(stmt)

    async def _compute_percentiles(self, session: AsyncSession):
        """Compute percentile rankings by borough and citywide."""
        # Citywide percentiles
        await session.execute(
            text("""
                UPDATE building_scores bs
                SET percentile_city = sub.percentile
                FROM (
                    SELECT
                        bbl,
                        PERCENT_RANK() OVER (ORDER BY overall_score DESC) * 100 as percentile
                    FROM building_scores
                ) sub
                WHERE bs.bbl = sub.bbl
            """)
        )

        # Borough percentiles
        await session.execute(
            text("""
                UPDATE building_scores bs
                SET percentile_borough = sub.percentile
                FROM (
                    SELECT
                        bs2.bbl,
                        PERCENT_RANK() OVER (
                            PARTITION BY b.borough
                            ORDER BY bs2.overall_score DESC
                        ) * 100 as percentile
                    FROM building_scores bs2
                    JOIN buildings b ON bs2.bbl = b.bbl
                ) sub
                WHERE bs.bbl = sub.bbl
            """)
        )

    async def compute_portfolio_scores(self):
        """Compute scores for owner portfolios."""
        async with AsyncSessionLocal() as session:
            await session.execute(
                text("""
                    UPDATE owner_portfolios op
                    SET
                        portfolio_score = sub.avg_score,
                        portfolio_grade = CASE
                            WHEN sub.avg_score < 20 THEN 'A'
                            WHEN sub.avg_score < 40 THEN 'B'
                            WHEN sub.avg_score < 60 THEN 'C'
                            WHEN sub.avg_score < 80 THEN 'D'
                            ELSE 'F'
                        END
                    FROM (
                        SELECT
                            rc.owner_portfolio_id,
                            AVG(bs.overall_score) as avg_score
                        FROM registration_contacts rc
                        JOIN hpd_registrations hr ON rc.registration_id = hr.registration_id
                        JOIN building_scores bs ON hr.bbl = bs.bbl
                        WHERE rc.owner_portfolio_id IS NOT NULL
                        GROUP BY rc.owner_portfolio_id
                    ) sub
                    WHERE op.id = sub.owner_portfolio_id
                """)
            )
            await session.commit()
