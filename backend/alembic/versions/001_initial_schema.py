"""Initial schema for IsMyLandlordShady.nyc

Revision ID: 001
Revises:
Create Date: 2025-01-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable required PostgreSQL extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')

    # Create buildings table
    op.create_table(
        'buildings',
        sa.Column('bbl', sa.String(10), primary_key=True),
        sa.Column('borough', sa.String(20), nullable=False),
        sa.Column('block', sa.Integer(), nullable=False),
        sa.Column('lot', sa.Integer(), nullable=False),
        sa.Column('house_number', sa.String(20)),
        sa.Column('street_name', sa.String(100)),
        sa.Column('full_address', sa.String(200)),
        sa.Column('zip_code', sa.String(10)),
        sa.Column('total_units', sa.Integer(), default=0),
        sa.Column('residential_units', sa.Integer(), default=0),
        sa.Column('year_built', sa.Integer()),
        sa.Column('building_class', sa.String(10)),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('geom', Geometry('POINT', srid=4326)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_buildings_address', 'buildings', ['full_address'])
    op.create_index('idx_buildings_borough_block', 'buildings', ['borough', 'block'])
    # Create trigram index for fuzzy search
    op.execute('CREATE INDEX idx_buildings_address_trgm ON buildings USING gin (full_address gin_trgm_ops)')

    # Create owner_portfolios table
    op.create_table(
        'owner_portfolios',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('primary_name', sa.String(300), nullable=False),
        sa.Column('normalized_name', sa.String(300)),
        sa.Column('name_hash', sa.String(32), unique=True),
        sa.Column('primary_address', sa.Text()),
        sa.Column('normalized_address', sa.Text()),
        sa.Column('total_buildings', sa.Integer(), default=0),
        sa.Column('total_units', sa.Integer(), default=0),
        sa.Column('total_violations', sa.Integer(), default=0),
        sa.Column('total_complaints', sa.Integer(), default=0),
        sa.Column('total_evictions', sa.Integer(), default=0),
        sa.Column('class_c_violations', sa.Integer(), default=0),
        sa.Column('class_b_violations', sa.Integer(), default=0),
        sa.Column('class_a_violations', sa.Integer(), default=0),
        sa.Column('portfolio_score', sa.Float()),
        sa.Column('portfolio_grade', sa.String(2)),
        sa.Column('is_llc', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_owner_portfolios_name_hash', 'owner_portfolios', ['name_hash'])
    op.create_index('idx_owner_portfolios_score', 'owner_portfolios', ['portfolio_score'])

    # Create building_scores table
    op.create_table(
        'building_scores',
        sa.Column('bbl', sa.String(10), sa.ForeignKey('buildings.bbl'), primary_key=True),
        sa.Column('violation_score', sa.Float(), default=0),
        sa.Column('complaints_score', sa.Float(), default=0),
        sa.Column('eviction_score', sa.Float(), default=0),
        sa.Column('ownership_score', sa.Float(), default=0),
        sa.Column('resolution_score', sa.Float(), default=0),
        sa.Column('overall_score', sa.Float(), default=0),
        sa.Column('grade', sa.String(2)),
        sa.Column('total_violations', sa.Integer(), default=0),
        sa.Column('class_c_violations', sa.Integer(), default=0),
        sa.Column('class_b_violations', sa.Integer(), default=0),
        sa.Column('class_a_violations', sa.Integer(), default=0),
        sa.Column('open_violations', sa.Integer(), default=0),
        sa.Column('total_complaints', sa.Integer(), default=0),
        sa.Column('total_evictions', sa.Integer(), default=0),
        sa.Column('avg_resolution_days', sa.Float()),
        sa.Column('violations_per_unit', sa.Float(), default=0),
        sa.Column('complaints_per_unit', sa.Float(), default=0),
        sa.Column('evictions_per_unit', sa.Float(), default=0),
        sa.Column('percentile_borough', sa.Float()),
        sa.Column('percentile_city', sa.Float()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_building_scores_grade', 'building_scores', ['grade'])
    op.create_index('idx_building_scores_overall', 'building_scores', ['overall_score'])

    # Create hpd_registrations table
    op.create_table(
        'hpd_registrations',
        sa.Column('registration_id', sa.Integer(), primary_key=True),
        sa.Column('bbl', sa.String(10), nullable=False),
        sa.Column('building_id', sa.Integer()),
        sa.Column('bin', sa.String(10)),
        sa.Column('house_number', sa.String(20)),
        sa.Column('street_name', sa.String(100)),
        sa.Column('borough', sa.String(20)),
        sa.Column('zip_code', sa.String(10)),
        sa.Column('block', sa.Integer()),
        sa.Column('lot', sa.Integer()),
        sa.Column('last_registration_date', sa.Date()),
        sa.Column('registration_end_date', sa.Date()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_hpd_registrations_bbl', 'hpd_registrations', ['bbl'])

    # Create registration_contacts table
    op.create_table(
        'registration_contacts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('registration_id', sa.Integer(), sa.ForeignKey('hpd_registrations.registration_id'), nullable=False),
        sa.Column('contact_type', sa.String(50)),
        sa.Column('contact_description', sa.String(100)),
        sa.Column('corporation_name', sa.String(200)),
        sa.Column('first_name', sa.String(100)),
        sa.Column('middle_initial', sa.String(10)),
        sa.Column('last_name', sa.String(100)),
        sa.Column('full_name', sa.String(300)),
        sa.Column('business_address', sa.Text()),
        sa.Column('business_city', sa.String(100)),
        sa.Column('business_state', sa.String(50)),
        sa.Column('business_zip', sa.String(20)),
        sa.Column('normalized_name', sa.String(300)),
        sa.Column('normalized_address', sa.Text()),
        sa.Column('name_hash', sa.String(32)),
        sa.Column('owner_portfolio_id', sa.Integer(), sa.ForeignKey('owner_portfolios.id')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('registration_id', 'contact_type', 'full_name', name='uq_registration_contacts_natural_key'),
    )
    op.create_index('idx_registration_contacts_registration_id', 'registration_contacts', ['registration_id'])
    op.create_index('idx_registration_contacts_normalized_name', 'registration_contacts', ['normalized_name'])
    op.create_index('idx_registration_contacts_name_hash', 'registration_contacts', ['name_hash'])

    # Create hpd_violations table
    op.create_table(
        'hpd_violations',
        sa.Column('violation_id', sa.Integer(), primary_key=True),
        sa.Column('bbl', sa.String(10), nullable=False),
        sa.Column('building_id', sa.Integer()),
        sa.Column('registration_id', sa.Integer()),
        sa.Column('apartment', sa.String(20)),
        sa.Column('story', sa.String(20)),
        sa.Column('inspection_date', sa.Date()),
        sa.Column('approved_date', sa.Date()),
        sa.Column('original_certify_by_date', sa.Date()),
        sa.Column('original_correct_by_date', sa.Date()),
        sa.Column('new_certify_by_date', sa.Date()),
        sa.Column('new_correct_by_date', sa.Date()),
        sa.Column('certified_date', sa.Date()),
        sa.Column('order_number', sa.String(50)),
        sa.Column('novid', sa.Integer()),
        sa.Column('nov_description', sa.Text()),
        sa.Column('nov_issued_date', sa.Date()),
        sa.Column('current_status', sa.String(50)),
        sa.Column('current_status_date', sa.Date()),
        sa.Column('nov_type', sa.String(50)),
        sa.Column('violation_status', sa.String(50)),
        sa.Column('violation_class', sa.String(5)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_hpd_violations_bbl', 'hpd_violations', ['bbl'])
    op.create_index('idx_hpd_violations_class', 'hpd_violations', ['violation_class'])
    op.create_index('idx_hpd_violations_inspection_date', 'hpd_violations', ['inspection_date'])
    op.create_index('idx_hpd_violations_status', 'hpd_violations', ['current_status'])

    # Create complaints_311 table
    op.create_table(
        'complaints_311',
        sa.Column('unique_key', sa.Integer(), primary_key=True),
        sa.Column('bbl', sa.String(10)),
        sa.Column('created_date', sa.DateTime()),
        sa.Column('closed_date', sa.DateTime()),
        sa.Column('agency', sa.String(20)),
        sa.Column('agency_name', sa.String(100)),
        sa.Column('complaint_type', sa.String(100)),
        sa.Column('descriptor', sa.String(200)),
        sa.Column('location_type', sa.String(100)),
        sa.Column('incident_zip', sa.String(20)),
        sa.Column('incident_address', sa.String(200)),
        sa.Column('street_name', sa.String(100)),
        sa.Column('city', sa.String(100)),
        sa.Column('status', sa.String(50)),
        sa.Column('resolution_description', sa.Text()),
        sa.Column('resolution_action_updated_date', sa.DateTime()),
        sa.Column('borough', sa.String(50)),
        sa.Column('latitude', sa.String(50)),
        sa.Column('longitude', sa.String(50)),
        sa.Column('days_to_resolve', sa.Integer()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_complaints_311_bbl', 'complaints_311', ['bbl'])
    op.create_index('idx_complaints_311_complaint_type', 'complaints_311', ['complaint_type'])
    op.create_index('idx_complaints_311_created_date', 'complaints_311', ['created_date'])

    # Create evictions table
    op.create_table(
        'evictions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('court_index_number', sa.String(50), unique=True),
        sa.Column('docket_number', sa.String(50)),
        sa.Column('bbl', sa.String(10), sa.ForeignKey('buildings.bbl')),
        sa.Column('eviction_address', sa.String(200)),
        sa.Column('apt_seal', sa.String(50)),
        sa.Column('executed_date', sa.Date()),
        sa.Column('marshal_first_name', sa.String(100)),
        sa.Column('marshal_last_name', sa.String(100)),
        sa.Column('residential_commercial', sa.String(20)),
        sa.Column('borough', sa.String(50)),
        sa.Column('ejectment', sa.String(10)),
        sa.Column('eviction_zip', sa.String(20)),
        sa.Column('scheduled_status', sa.String(50)),
        sa.Column('latitude', sa.String(50)),
        sa.Column('longitude', sa.String(50)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_evictions_bbl', 'evictions', ['bbl'])
    op.create_index('idx_evictions_executed_date', 'evictions', ['executed_date'])

    # Create dob_violations table
    op.create_table(
        'dob_violations',
        sa.Column('isn_dob_bis_viol', sa.String(20), primary_key=True),
        sa.Column('bbl', sa.String(10), sa.ForeignKey('buildings.bbl')),
        sa.Column('bin', sa.String(10)),
        sa.Column('boro', sa.String(5)),
        sa.Column('block', sa.String(10)),
        sa.Column('lot', sa.String(10)),
        sa.Column('issue_date', sa.Date()),
        sa.Column('violation_type_code', sa.String(10)),
        sa.Column('violation_number', sa.String(50)),
        sa.Column('house_number', sa.String(20)),
        sa.Column('street', sa.String(100)),
        sa.Column('disposition_date', sa.Date()),
        sa.Column('disposition_comments', sa.Text()),
        sa.Column('device_number', sa.String(50)),
        sa.Column('description', sa.Text()),
        sa.Column('ecb_number', sa.String(50)),
        sa.Column('number', sa.String(20)),
        sa.Column('violation_category', sa.String(100)),
        sa.Column('violation_type', sa.String(100)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_dob_violations_bbl', 'dob_violations', ['bbl'])
    op.create_index('idx_dob_violations_issue_date', 'dob_violations', ['issue_date'])
    op.create_index('idx_dob_violations_type', 'dob_violations', ['violation_type'])


def downgrade() -> None:
    op.drop_table('dob_violations')
    op.drop_table('evictions')
    op.drop_table('complaints_311')
    op.drop_table('hpd_violations')
    op.drop_table('registration_contacts')
    op.drop_table('hpd_registrations')
    op.drop_table('building_scores')
    op.drop_table('owner_portfolios')
    op.drop_table('buildings')
