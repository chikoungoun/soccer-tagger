"""Add sent_off column to lineups table

Revision ID: add_sent_off_lineup
Revises:
Create Date: 2024-09-24

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_sent_off_lineup'
down_revision = None
depends_on = None

def upgrade():
    # Add sent_off column to lineups table
    op.add_column('lineups', sa.Column('sent_off', sa.Boolean, default=False, nullable=False))

def downgrade():
    # Remove sent_off column from lineups table
    op.drop_column('lineups', 'sent_off')