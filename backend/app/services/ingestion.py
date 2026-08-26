import requests
import datetime
import os


def fetch_celestrak_data(group="stations", format="csv"):
    """
    Fetches GP/OMM data from CelesTrak and stores the untouched response in data/raw/
    """
    url = f"https://celestrak.org/NORAD/elements/gp.php?GROUP={group}&FORMAT={format}"
    
    # Coordinated Universal Time (UTC) is the absolute only time representation used
    retrieval_time = datetime.datetime.now(datetime.timezone.utc)
    timestamp_str = retrieval_time.strftime("%Y%m%dT%H%M%SZ")
    
    print(f"Fetching data from: {url}")
    
    # Disguise the Python script as a standard web browser to bypass the block
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # Add a timeout to prevent the script from hanging forever
    response = requests.get(url, headers=headers, timeout=60)
    
    # Raise an error if the network request fails (e.g., 403 Forbidden or 404 Not Found)
    response.raise_for_status()
    
    # Ensure the raw directory exists
    os.makedirs("data/raw", exist_ok=True)
    
    # Store the exact raw artifact without modification
    output_filename = f"data/raw/celestrak_{group}_{timestamp_str}.{format}"
    
    with open(output_filename, "w", encoding="utf-8") as file:
        file.write(response.text)
        
    print(f"Raw snapshot exists at: {output_filename}")
    print(f"Retrieval Timestamp (UTC): {retrieval_time.isoformat()}")

if __name__ == "__main__":
    # Fetch a small known-good set (Space Stations) for first propagation testing
    fetch_celestrak_data(group="stations", format="csv")