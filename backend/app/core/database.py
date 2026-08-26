import sqlite3
import pandas as pd
from pathlib import Path

# Project root: space-debris-dashboard/
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Database: space-debris-dashboard/backend/space_debris.db
DB_PATH = PROJECT_ROOT / "backend" / "space_debris.db"

# Demo snapshot: space-debris-dashboard/data/demo_snapshot.csv
SNAPSHOT_PATH = PROJECT_ROOT / "data" / "demo_snapshot.csv"

def init_db():
    """Creates the SQLite database and the satellites table for Member 4."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create the table using the exact schema validated by Member 1[cite: 3]
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS satellites (
        norad_cat_id INTEGER PRIMARY KEY,
        object_name TEXT NOT NULL,
        epoch_utc TEXT NOT NULL,
        bstar REAL,
        inclination REAL,
        ra_of_asc_node REAL,
        eccentricity REAL,
        arg_of_pericenter REAL,
        mean_anomaly REAL,
        mean_motion REAL,
        source_url TEXT,
        retrieved_at TEXT
    )
    ''')
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def seed_database_from_snapshot():
    """Loads Member 1's frozen demo snapshot into Member 4's database[cite: 3]."""
    csv_path = SNAPSHOT_PATH

    if not csv_path.exists():
        print(f"Error: Could not find {csv_path}. Run normalization first.")
        return

    print(f"Reading frozen snapshot from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Rename CSV columns to match the SQLite database schema
    df = df.rename(columns={
        'NORAD_CAT_ID': 'norad_cat_id',
        'OBJECT_NAME': 'object_name',
        'EPOCH': 'epoch_utc',
        'BSTAR': 'bstar',
        'INCLINATION': 'inclination',
        'RA_OF_ASC_NODE': 'ra_of_asc_node',
        'ECCENTRICITY': 'eccentricity',
        'ARG_OF_PERICENTER': 'arg_of_pericenter',
        'MEAN_ANOMALY': 'mean_anomaly',
        'MEAN_MOTION': 'mean_motion',
        'SOURCE_URL': 'source_url',
        'RETRIEVED_AT': 'retrieved_at'
    })

    conn = sqlite3.connect(DB_PATH)

    # Recreate the table using our defined schema
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS satellites")
    conn.commit()
    conn.close()

    init_db()

    conn = sqlite3.connect(DB_PATH)

    # Insert data into the existing table without replacing its schema
    df.to_sql('satellites', conn, if_exists='append', index=False)
    
    # Verify the insertion
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM satellites")
    count = cursor.fetchone()[0]
    
    conn.close()
    print(f"Success! Seeded {count} objects into the SQLite database.")

if __name__ == "__main__":
    # Execute the database setup and seeding
    init_db()
    seed_database_from_snapshot() 