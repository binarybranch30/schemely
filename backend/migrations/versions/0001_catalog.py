"""Create the scheme catalog."""

from alembic import op
import sqlalchemy as sa

revision = "0001_catalog"
down_revision = None


def upgrade():
    op.create_table("scheme_categories",
        sa.Column("id", sa.String(40), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True))
    op.create_table("schemes",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category_id", sa.String(40), sa.ForeignKey("scheme_categories.id"), nullable=False),
        sa.Column("level", sa.String(10), nullable=False),
        sa.Column("state", sa.String(80)),
        sa.Column("department", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("benefits", sa.Text(), nullable=False),
        sa.Column("application_process", sa.Text(), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.Column("demo", sa.Boolean(), nullable=False),
        sa.CheckConstraint("level IN ('central', 'state')", name="valid_level"),
        sa.CheckConstraint("(level = 'central' AND state IS NULL) OR (level = 'state' AND state IS NOT NULL)", name="valid_scope"))
    for column in ("category_id", "name", "state"):
        op.create_index(f"ix_schemes_{column}", "schemes", [column])
    children = {
        "eligibility_rules": [
            sa.Column("field", sa.String(50), nullable=False),
            sa.Column("operator", sa.String(10), nullable=False),
            sa.Column("value", sa.JSON(), nullable=False),
            sa.CheckConstraint("operator IN ('eq', 'in', 'gte', 'lte')", name="valid_operator"),
        ],
        "scheme_documents": [sa.Column("name", sa.String(200), nullable=False)],
        "scheme_sources": [
            sa.Column("url", sa.String(500), nullable=False),
            sa.Column("application_url", sa.String(500)),
            sa.Column("verification_status", sa.String(60), nullable=False),
            sa.Column("last_verified", sa.Date()),
        ],
    }
    for table, columns in children.items():
        op.create_table(table,
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("scheme_id", sa.String(80), sa.ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False),
            *columns)
        op.create_index(f"ix_{table}_scheme_id", table, ["scheme_id"])


def downgrade():
    for table in ("scheme_sources", "scheme_documents", "eligibility_rules", "schemes", "scheme_categories"):
        op.drop_table(table)
