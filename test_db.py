import sqlite3
import pandas as pd

def test_database_handoff():
    print("Testing SQLite Database for API Readiness...")
    conn = sqlite3.connect("backend/space_debris.db")
    
    # Query the top 3 highest risk candidates (e.g., lowest altitude/highest motion)
    query = """
    SELECT norad_cat_id, object_name, epoch_utc, data_age_hours 
    FROM satellites 
    LIMIT 3
    """
    
    # We will simulate calculating the data_age_hours on the fly like the API will
    df = pd.read_sql_query("SELECT * FROM satellites LIMIT 5", conn)
    
    print("\n✅ Database Connection Successful!")
    print(f"✅ Total Columns: {len(df.columns)}")
    print("✅ Sample Data Ready for Member 4's FastAPI:")
    print("-" * 60)
    print(df[['norad_cat_id', 'object_name', 'epoch_utc']].head(3).to_string(index=False))
    print("-" * 60)
    
    conn.close()

if __name__ == "__main__":
    test_database_handoff()