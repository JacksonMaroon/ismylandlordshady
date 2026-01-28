"""Drop DOB violations BBL foreign key

Revision ID: 003
Revises: 002
Create Date: 2026-01-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "dob_violations_bbl_fkey",
        "dob_violations",
        type_="foreignkey",
    )


def downgrade() -> None:
    op.create_foreign_key(
        "dob_violations_bbl_fkey",
        "dob_violations",
        "buildings",
        ["bbl"],
        ["bbl"],
    )
