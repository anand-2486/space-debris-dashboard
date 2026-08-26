import pandas as pd
import glob
import os
from datetime import datetime, timezone

def normalize_latest_raw_data():
    # 1. Find the newest raw file in the folder
    raw_files = glob.glob("data/raw/*.csv")
    if not raw_files:
        print("No raw files found!")
        return
        
    latest_file = max(raw_files, key=os.path.getctime)
    print(f"Normalizing raw data from: {latest_file}")

    df = pd.read_csv(latest_file)
    total_records = len(df)

    # 2. Enforce required fields matching docs/data_contract.md
    required_columns = [
        'NORAD_CAT_ID', 'OBJECT_NAME', 'EPOCH', 'BSTAR', 
        'INCLINATION', 'RA_OF_ASC_NODE', 'ECCENTRICITY', 
        'ARG_OF_PERICENTER', 'MEAN_ANOMALY', 'MEAN_MOTION'
    ]

    # 3. Reject/flag malformed records instead of silently fabricating values[cite: 1]
    clean_df = df.dropna(subset=required_columns).copy()
    valid_records = len(clean_df)
    invalid_records = total_records - valid_records

    # 4. Preserve metadata (We stamp it here since we manually downloaded)[cite: 1]
    clean_df['SOURCE_URL'] = "CelesTrak (Manual Download)"
    clean_df['RETRIEVED_AT'] = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    # 5. Use deterministic sorting for reproducibility[cite: 1]
    clean_df = clean_df.sort_values(by='NORAD_CAT_ID')

    # Select only the needed columns
    final_df = clean_df[required_columns + ['SOURCE_URL', 'RETRIEVED_AT']]

    # Limit to MVP scope (e.g., maximum 500 objects)[cite: 1]
    final_df = final_df.head(500)

    # 6. Save processed output and the frozen demo snapshot[cite: 1]
    os.makedirs("data/processed", exist_ok=True)
    final_df.to_csv("data/processed/objects.csv", index=False)
    final_df.to_csv("data/demo_snapshot.csv", index=False)

    print(f"Total Parsed: {total_records} | Valid: {valid_records} | Invalid Rejected: {invalid_records}")
    print(f"Final MVP Dataset Size: {len(final_df)} objects")
    print("Clean dataset saved to data/processed/objects.csv and data/demo_snapshot.csv")

if __name__ == "__main__":
    normalize_latest_raw_data()