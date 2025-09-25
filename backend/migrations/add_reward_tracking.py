"""
Database migration: Add reward tracking tables and fields
Run this script to safely add the new tables and columns for reward tracking
"""
import sqlite3
import sys
import os
from datetime import datetime

# Add the parent directory to the path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def migrate_database(db_path: str = "soccer_manager.db"):
    """Add reward tracking fields and tables to existing database"""

    print(f"Starting database migration for reward tracking...")
    print(f"Database: {db_path}")

    # Create backup
    backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    print(f"Creating backup: {backup_path}")

    try:
        # Create backup
        with open(db_path, 'rb') as src, open(backup_path, 'wb') as dst:
            dst.write(src.read())
        print("✅ Backup created successfully")
    except Exception as e:
        print(f"❌ Failed to create backup: {e}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("\n🔄 Adding new columns to match_events table...")

        # Add new columns to match_events table
        new_columns = [
            "ALTER TABLE match_events ADD COLUMN edit_count INTEGER DEFAULT 0 NOT NULL",
            "ALTER TABLE match_events ADD COLUMN is_admin_corrected BOOLEAN DEFAULT 0 NOT NULL",
            "ALTER TABLE match_events ADD COLUMN admin_correction_reason VARCHAR(255)"
        ]

        for sql in new_columns:
            try:
                cursor.execute(sql)
                print(f"✅ Added column: {sql.split('ADD COLUMN')[1].split()[0]}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"⚠️  Column already exists: {sql.split('ADD COLUMN')[1].split()[0]}")
                else:
                    raise e

        print("\n🔄 Creating event_edit_logs table...")

        # Create event_edit_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS event_edit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL REFERENCES match_events(id),
                original_tagger_id INTEGER NOT NULL REFERENCES users(id),
                editor_id INTEGER NOT NULL REFERENCES users(id),
                edit_type VARCHAR(50) NOT NULL,
                field_changed VARCHAR(100),
                old_value TEXT,
                new_value TEXT,
                correction_reason TEXT,
                severity VARCHAR(20) DEFAULT 'minor',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ event_edit_logs table created")

        print("\n🔄 Creating match_rewards table...")

        # Create match_rewards table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_rewards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fixture_id INTEGER NOT NULL REFERENCES fixtures(id),
                tagger_id INTEGER NOT NULL REFERENCES users(id),
                events_logged INTEGER DEFAULT 0 NOT NULL,
                admin_corrections INTEGER DEFAULT 0 NOT NULL,
                events_added_by_admin INTEGER DEFAULT 0 NOT NULL,
                events_removed_by_admin INTEGER DEFAULT 0 NOT NULL,
                base_reward REAL DEFAULT 50.0 NOT NULL,
                price_per_event REAL NOT NULL,
                accuracy_percentage REAL NOT NULL,
                final_reward REAL NOT NULL,
                is_finalized BOOLEAN DEFAULT 0,
                paid_out BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                finalized_at DATETIME,
                UNIQUE(fixture_id, tagger_id)
            )
        """)
        print("✅ match_rewards table created")

        print("\n🔄 Creating indexes for performance...")

        # Create indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_event_edit_logs_event_id ON event_edit_logs(event_id)",
            "CREATE INDEX IF NOT EXISTS idx_event_edit_logs_tagger ON event_edit_logs(original_tagger_id)",
            "CREATE INDEX IF NOT EXISTS idx_event_edit_logs_editor ON event_edit_logs(editor_id)",
            "CREATE INDEX IF NOT EXISTS idx_match_rewards_fixture ON match_rewards(fixture_id)",
            "CREATE INDEX IF NOT EXISTS idx_match_rewards_tagger ON match_rewards(tagger_id)",
            "CREATE INDEX IF NOT EXISTS idx_match_rewards_finalized ON match_rewards(is_finalized)",
            "CREATE INDEX IF NOT EXISTS idx_match_events_created_by ON match_events(created_by)",
            "CREATE INDEX IF NOT EXISTS idx_match_events_fixture_tagger ON match_events(fixture_id, created_by)"
        ]

        for index_sql in indexes:
            cursor.execute(index_sql)
            index_name = index_sql.split("IF NOT EXISTS")[1].split("ON")[0].strip()
            print(f"✅ Created index: {index_name}")

        # Commit all changes
        conn.commit()
        print("\n✅ Migration completed successfully!")

        # Verify tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('event_edit_logs', 'match_rewards')")
        tables = cursor.fetchall()
        print(f"📊 New tables created: {[t[0] for t in tables]}")

        # Check column additions
        cursor.execute("PRAGMA table_info(match_events)")
        columns = [col[1] for col in cursor.fetchall()]
        new_cols = [col for col in ['edit_count', 'is_admin_corrected', 'admin_correction_reason'] if col in columns]
        print(f"📊 New columns added to match_events: {new_cols}")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print(f"🔄 Restoring from backup...")
        try:
            # Restore from backup
            with open(backup_path, 'rb') as src, open(db_path, 'wb') as dst:
                dst.write(src.read())
            print("✅ Database restored from backup")
        except Exception as restore_error:
            print(f"❌ Failed to restore backup: {restore_error}")
        return False

if __name__ == "__main__":
    # Run migration
    success = migrate_database()
    if success:
        print("\n🎉 Reward tracking system has been successfully installed!")
        print("You can now:")
        print("  - Track admin edits to events")
        print("  - Calculate tagger accuracy and rewards")
        print("  - View performance statistics")
        print("  - Generate leaderboards")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)