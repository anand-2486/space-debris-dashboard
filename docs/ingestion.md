# Data Ingestion Documentation

**Source:** CelesTrak General Perturbations (GP) API[cite: 1, 3].
**URL Format:** `https://celestrak.org/NORAD/elements/gp.php?GROUP={group_name}&FORMAT=csv`

## Execution Command
To fetch the latest orbital snapshot, run this script from the repository root:
`python services/ingestion.py`

## Expected Output
*   The script downloads the exact GP/OMM data in CSV format.
*   It saves the raw, unmodified response directly into the `data/raw/` directory[cite: 1].
*   The filename includes a strict UTC timestamp (e.g., `celestrak_stations_20260825T133000Z.csv`) to record the exact retrieval time[cite: 1].
*   The output CSV contains all required propagation fields (e.g., `EPOCH`, `INCLINATION`, `ECCENTRICITY`, `MEAN_MOTION`) expected by the Data Contract[cite: 1].