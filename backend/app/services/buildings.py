from typing import Optional
from datetime import datetime, timedelta

from sqlalchemy import select, func, text, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.building import Building
from app.models.hpd import HPDViolation, HPDRegistration, RegistrationContact
from app.models.complaints import Complaint311
from app.models.eviction import Eviction
from app.models.score import BuildingScore
from app.models.owner import OwnerPortfolio


class BuildingService:
    """Service for building-related queries."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def search_buildings(
        self,
        query: str,
        limit: int = 10,
    ) -> list[dict]:
        """Search buildings by address with fuzzy matching."""
        if len(query) < 3:
            return []

        # Use trigram similarity for fuzzy search
        sql = text("""
            SELECT
                b.bbl,
                b.full_address,
                b.borough,
                b.total_units,
                bs.grade,
                bs.overall_score,
                similarity(b.full_address, :query) as sim
            FROM buildings b
            LEFT JOIN building_scores bs ON b.bbl = bs.bbl
            WHERE b.full_address % :query
            ORDER BY sim DESC
            LIMIT :limit
        """)

        result = await self.session.execute(
            sql, {"query": query.upper(), "limit": limit}
        )

        return [
            {
                "bbl": row.bbl,
                "address": row.full_address,
                "borough": row.borough,
                "units": row.total_units,
                "grade": row.grade,
                "score": row.overall_score,
            }
            for row in result
        ]

    async def get_building_by_bbl(self, bbl: str) -> Optional[Building]:
        """Get building by BBL with related data."""
        query = (
            select(Building)
            .options(selectinload(Building.score))
            .where(Building.bbl == bbl)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_building_report(self, bbl: str) -> Optional[dict]:
        """Get comprehensive building report."""
        building = await self.get_building_by_bbl(bbl)
        if not building:
            return None

        # Get owner info
        owner = await self._get_building_owner(bbl)

        # Get violation summary
        violations = await self._get_violation_summary(bbl)

        # Get recent violations
        recent_violations = await self.get_violations(bbl, limit=10)

        # Get complaint summary
        complaints = await self._get_complaint_summary(bbl)

        # Get eviction count
        eviction_count = await self._get_eviction_count(bbl)

        score = building.score

        return {
            "bbl": building.bbl,
            "address": building.full_address,
            "borough": building.borough,
            "zip_code": building.zip_code,
            "total_units": building.total_units,
            "residential_units": building.residential_units,
            "year_built": building.year_built,
            "latitude": building.latitude,
            "longitude": building.longitude,
            "score": {
                "overall": score.overall_score if score else None,
                "grade": score.grade if score else None,
                "violation_score": score.violation_score if score else None,
                "complaints_score": score.complaints_score if score else None,
                "eviction_score": score.eviction_score if score else None,
                "ownership_score": score.ownership_score if score else None,
                "resolution_score": score.resolution_score if score else None,
                "percentile_city": score.percentile_city if score else None,
                "percentile_borough": score.percentile_borough if score else None,
            } if score else None,
            "owner": owner,
            "violations": violations,
            "recent_violations": recent_violations,
            "complaints": complaints,
            "evictions": {"total": eviction_count},
        }

    async def _get_building_owner(self, bbl: str) -> Optional[dict]:
        """Get current owner info for a building."""
        query = text("""
            SELECT
                rc.full_name,
                rc.corporation_name,
                rc.business_address,
                rc.business_city,
                rc.business_state,
                rc.business_zip,
                op.id as portfolio_id,
                op.total_buildings,
                op.portfolio_grade,
                op.is_llc
            FROM hpd_registrations hr
            JOIN registration_contacts rc ON hr.registration_id = rc.registration_id
            LEFT JOIN owner_portfolios op ON rc.owner_portfolio_id = op.id
            WHERE hr.bbl = :bbl
            AND rc.contact_type IN ('CorporateOwner', 'HeadOfficer', 'IndividualOwner', 'JointOwner', 'Owner')
            ORDER BY hr.last_registration_date DESC NULLS LAST
            LIMIT 1
        """)

        result = await self.session.execute(query, {"bbl": bbl})
        row = result.first()

        if not row:
            return None

        return {
            "name": row.corporation_name or row.full_name,
            "address": f"{row.business_address}, {row.business_city}, {row.business_state} {row.business_zip}".strip(", "),
            "portfolio_id": row.portfolio_id,
            "portfolio_size": row.total_buildings,
            "portfolio_grade": row.portfolio_grade,
            "is_llc": bool(row.is_llc),
        }

    async def _get_violation_summary(self, bbl: str) -> dict:
        """Get violation summary by class."""
        query = (
            select(
                HPDViolation.violation_class,
                HPDViolation.current_status,
                func.count(HPDViolation.violation_id),
            )
            .where(HPDViolation.bbl == bbl)
            .group_by(HPDViolation.violation_class, HPDViolation.current_status)
        )

        result = await self.session.execute(query)

        summary = {
            "total": 0,
            "open": 0,
            "by_class": {"A": 0, "B": 0, "C": 0},
        }

        for row in result:
            class_type = row[0]
            status = row[1]
            count = row[2]

            summary["total"] += count
            if class_type in summary["by_class"]:
                summary["by_class"][class_type] += count
            if status in ("OPEN", "NOV SENT"):
                summary["open"] += count

        return summary

    async def _get_complaint_summary(self, bbl: str) -> dict:
        """Get complaint summary."""
        # Total count
        total_query = (
            select(func.count(Complaint311.unique_key))
            .where(Complaint311.bbl == bbl)
        )
        total = (await self.session.execute(total_query)).scalar() or 0

        # Recent count (last year)
        one_year_ago = datetime.now() - timedelta(days=365)
        recent_query = (
            select(func.count(Complaint311.unique_key))
            .where(
                Complaint311.bbl == bbl,
                Complaint311.created_date >= one_year_ago,
            )
        )
        recent = (await self.session.execute(recent_query)).scalar() or 0

        # By type
        type_query = (
            select(
                Complaint311.complaint_type,
                func.count(Complaint311.unique_key),
            )
            .where(Complaint311.bbl == bbl)
            .group_by(Complaint311.complaint_type)
            .order_by(func.count(Complaint311.unique_key).desc())
            .limit(5)
        )
        type_result = await self.session.execute(type_query)

        return {
            "total": total,
            "last_year": recent,
            "by_type": [
                {"type": row[0], "count": row[1]}
                for row in type_result
            ],
        }

    async def _get_eviction_count(self, bbl: str) -> int:
        """Get eviction count for building."""
        query = (
            select(func.count(Eviction.id))
            .where(Eviction.bbl == bbl)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_violations_count(
        self,
        bbl: str,
        status: Optional[str] = None,
        violation_class: Optional[str] = None,
    ) -> int:
        """Get total count of violations for a building with optional filters."""
        query = select(func.count(HPDViolation.violation_id)).where(HPDViolation.bbl == bbl)

        if status:
            query = query.where(HPDViolation.current_status == status)
        if violation_class:
            query = query.where(HPDViolation.violation_class == violation_class)

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_violations(
        self,
        bbl: str,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
        violation_class: Optional[str] = None,
    ) -> list[dict]:
        """Get paginated violations for a building."""
        query = (
            select(HPDViolation)
            .where(HPDViolation.bbl == bbl)
        )

        if status:
            query = query.where(HPDViolation.current_status == status)
        if violation_class:
            query = query.where(HPDViolation.violation_class == violation_class)

        query = (
            query
            .order_by(HPDViolation.inspection_date.desc().nulls_last())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        violations = result.scalars().all()

        return [
            {
                "id": v.violation_id,
                "class": v.violation_class,
                "status": v.current_status,
                "inspection_date": v.inspection_date.isoformat() if v.inspection_date else None,
                "description": v.nov_description,
                "apartment": v.apartment,
                "story": v.story,
            }
            for v in violations
        ]

    async def get_timeline(self, bbl: str, limit: int = 50) -> list[dict]:
        """Get combined timeline of events for a building."""
        # Get violations
        violations_query = text("""
            SELECT
                'violation' as event_type,
                COALESCE(inspection_date, nov_issued_date) as event_date,
                violation_class as severity,
                nov_description as description,
                current_status as status
            FROM hpd_violations
            WHERE bbl = :bbl
            AND (inspection_date IS NOT NULL OR nov_issued_date IS NOT NULL)
        """)

        # Get complaints
        complaints_query = text("""
            SELECT
                'complaint' as event_type,
                created_date as event_date,
                complaint_type as severity,
                descriptor as description,
                status
            FROM complaints_311
            WHERE bbl = :bbl
            AND created_date IS NOT NULL
        """)

        # Get evictions
        evictions_query = text("""
            SELECT
                'eviction' as event_type,
                executed_date as event_date,
                'EVICTION' as severity,
                eviction_address as description,
                scheduled_status as status
            FROM evictions
            WHERE bbl = :bbl
            AND executed_date IS NOT NULL
        """)

        # Combine and order
        combined_query = text(f"""
            ({violations_query.text})
            UNION ALL
            ({complaints_query.text})
            UNION ALL
            ({evictions_query.text})
            ORDER BY event_date DESC NULLS LAST
            LIMIT :limit
        """)

        result = await self.session.execute(combined_query, {"bbl": bbl, "limit": limit})

        return [
            {
                "type": row.event_type,
                "date": row.event_date.isoformat() if row.event_date else None,
                "severity": row.severity,
                "description": row.description,
                "status": row.status,
            }
            for row in result
        ]

    async def get_recent_violations(
        self,
        limit: int = 50,
        violation_class: Optional[str] = None,
    ) -> list[dict]:
        """Get recent violations across all buildings with building info."""
        # Use mappers for proper parameter binding with SQLAlchemy text()
        params = {"limit": limit}
        
        if violation_class:
            where_clause = "WHERE v.inspection_date IS NOT NULL AND v.violation_class = :violation_class"
            params["violation_class"] = violation_class
        else:
            where_clause = "WHERE v.inspection_date IS NOT NULL"
        
        query = text(f"""
            SELECT
                v.violation_id,
                v.violation_class,
                v.current_status,
                v.inspection_date,
                v.nov_description,
                v.apartment,
                v.story,
                v.bbl,
                b.full_address,
                b.borough
            FROM hpd_violations v
            LEFT JOIN buildings b ON v.bbl = b.bbl
            {where_clause}
            ORDER BY v.inspection_date DESC
            LIMIT :limit
        """)

        result = await self.session.execute(query, params)

        return [
            {
                "id": row.violation_id,
                "class": row.violation_class,
                "status": row.current_status,
                "inspection_date": row.inspection_date.isoformat() if row.inspection_date else None,
                "description": row.nov_description,
                "apartment": row.apartment,
                "story": row.story,
                "bbl": row.bbl,
                "address": row.full_address,
                "borough": row.borough,
            }
            for row in result
        ]


class OwnerService:
    """Service for owner/portfolio-related queries."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_portfolio(self, portfolio_id: int) -> Optional[dict]:
        """Get owner portfolio details."""
        query = select(OwnerPortfolio).where(OwnerPortfolio.id == portfolio_id)
        result = await self.session.execute(query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            return None

        # Get buildings in portfolio
        buildings = await self._get_portfolio_buildings(portfolio_id)

        return {
            "id": portfolio.id,
            "name": portfolio.primary_name,
            "address": portfolio.primary_address,
            "is_llc": bool(portfolio.is_llc),
            "stats": {
                "total_buildings": portfolio.total_buildings,
                "total_units": portfolio.total_units,
                "total_violations": portfolio.total_violations,
                "class_c_violations": portfolio.class_c_violations,
                "class_b_violations": portfolio.class_b_violations,
                "class_a_violations": portfolio.class_a_violations,
            },
            "score": portfolio.portfolio_score,
            "grade": portfolio.portfolio_grade,
            "buildings": buildings,
        }

    async def _get_portfolio_buildings(
        self, portfolio_id: int, limit: int = 100
    ) -> list[dict]:
        """Get buildings in a portfolio."""
        query = text("""
            SELECT DISTINCT
                b.bbl,
                b.full_address,
                b.borough,
                b.total_units,
                bs.overall_score,
                bs.grade
            FROM registration_contacts rc
            JOIN hpd_registrations hr ON rc.registration_id = hr.registration_id
            JOIN buildings b ON hr.bbl = b.bbl
            LEFT JOIN building_scores bs ON b.bbl = bs.bbl
            WHERE rc.owner_portfolio_id = :portfolio_id
            ORDER BY bs.overall_score DESC NULLS LAST
            LIMIT :limit
        """)

        result = await self.session.execute(
            query, {"portfolio_id": portfolio_id, "limit": limit}
        )

        return [
            {
                "bbl": row.bbl,
                "address": row.full_address,
                "borough": row.borough,
                "units": row.total_units,
                "score": row.overall_score,
                "grade": row.grade,
            }
            for row in result
        ]


class LeaderboardService:
    """Service for leaderboard/ranking queries."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_worst_buildings_count(
        self,
        borough: Optional[str] = None,
    ) -> int:
        """Get total count of buildings with scores for pagination."""
        if borough:
            query = text("""
                SELECT COUNT(*)
                FROM buildings b
                JOIN building_scores bs ON b.bbl = bs.bbl
                WHERE b.borough = :borough
            """)
            result = await self.session.execute(query, {"borough": borough})
        else:
            query = text("""
                SELECT COUNT(*)
                FROM buildings b
                JOIN building_scores bs ON b.bbl = bs.bbl
            """)
            result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_worst_landlords_count(self) -> int:
        """Get total count of landlords with portfolio scores for pagination."""
        query = text("""
            SELECT COUNT(*)
            FROM owner_portfolios
            WHERE portfolio_score IS NOT NULL
            AND total_buildings > 1
        """)

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_worst_buildings(
        self,
        borough: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """Get worst buildings by score."""
        if borough:
            query = text("""
                SELECT
                    b.bbl,
                    b.full_address,
                    b.borough,
                    b.zip_code,
                    b.total_units,
                    bs.overall_score,
                    bs.grade,
                    bs.total_violations,
                    bs.class_c_violations,
                    bs.total_complaints,
                    bs.total_evictions
                FROM buildings b
                JOIN building_scores bs ON b.bbl = bs.bbl
                WHERE b.borough = :borough
                ORDER BY bs.overall_score DESC
                LIMIT :limit
                OFFSET :offset
            """)
            result = await self.session.execute(
                query, {"borough": borough, "limit": limit, "offset": offset}
            )
        else:
            query = text("""
                SELECT
                    b.bbl,
                    b.full_address,
                    b.borough,
                    b.zip_code,
                    b.total_units,
                    bs.overall_score,
                    bs.grade,
                    bs.total_violations,
                    bs.class_c_violations,
                    bs.total_complaints,
                    bs.total_evictions
                FROM buildings b
                JOIN building_scores bs ON b.bbl = bs.bbl
                ORDER BY bs.overall_score DESC
                LIMIT :limit
                OFFSET :offset
            """)
            result = await self.session.execute(
                query, {"limit": limit, "offset": offset}
            )

        return [
            {
                "bbl": row.bbl,
                "address": row.full_address,
                "borough": row.borough,
                "zip_code": row.zip_code,
                "units": row.total_units,
                "score": row.overall_score,
                "grade": row.grade,
                "violations": row.total_violations,
                "class_c": row.class_c_violations,
                "complaints": row.total_complaints,
                "evictions": row.total_evictions,
            }
            for row in result
        ]

    async def get_worst_landlords(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """Get worst landlords by portfolio score."""
        query = text("""
            SELECT
                id,
                primary_name,
                total_buildings,
                total_units,
                total_violations,
                class_c_violations,
                portfolio_score,
                portfolio_grade,
                is_llc
            FROM owner_portfolios
            WHERE portfolio_score IS NOT NULL
            AND total_buildings > 1
            ORDER BY portfolio_score DESC
            LIMIT :limit
            OFFSET :offset
        """)

        result = await self.session.execute(
            query, {"limit": limit, "offset": offset}
        )

        return [
            {
                "id": row.id,
                "name": row.primary_name,
                "buildings": row.total_buildings,
                "units": row.total_units,
                "violations": row.total_violations,
                "class_c": row.class_c_violations,
                "score": row.portfolio_score,
                "grade": row.portfolio_grade,
                "is_llc": bool(row.is_llc),
            }
            for row in result
        ]
