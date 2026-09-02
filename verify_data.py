import os
import glob
from sgp4.api import Satrec, jday
from sgp4 import omm
from datetime import datetime, timedelta, timezone

# 1. Locate the latest raw CSV downloaded in data/raw/
raw_files = glob.glob("data/raw/*.csv")
if not raw_files:
    print("❌ ERROR: No raw CSV found in data/raw/. Run ingestion.py first!")
    exit(1)

latest_file = max(raw_files, key=os.path.getctime)
print(f"🔍 Inspecting file: {latest_file}")

# 2. Extract a known target (e.g., ISS - NORAD ID 25544)
target_record = None
total_count = 0

with open(latest_file, "r", encoding="utf-8") as f:
    for record in omm.parse_csv(f):
        total_count += 1
        if record.get("NORAD_CAT_ID") == "25544":
            target_record = record

print(f"📊 Total objects detected in raw file: {total_count}")

if not target_record:
    print("⚠️ ISS (25544) not found. Testing first available object instead...")
    with open(latest_file, "r", encoding="utf-8") as f:
        target_record = next(omm.parse_csv(f))

# 3. Verify SGP4 initialization
sat = Satrec()
omm.initialize(sat, target_record)
print(f"✅ Loaded object: {target_record['OBJECT_NAME']} (NORAD: {target_record['NORAD_CAT_ID']})")
print(f"📅 Epoch (UTC): {target_record['EPOCH']}")

# 4. Day 1 PASS criteria: Propagate at now, +10m, +20m, +30m
print("\n--- Day 1 Propagation Test ---")
now_utc = datetime.now(timezone.utc)

all_passed = True
for offset_min in [0, 10, 20, 30]:
    t = now_utc + timedelta(minutes=offset_min)
    jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute, t.second)
    error_code, r, v = sat.sgp4(jd, fr)
    
    if error_code == 0:
        print(f"T+{offset_min:02d}m ({t.strftime('%H:%M:%S UTC')}): "
              f"r = [{r[0]:8.2f}, {r[1]:8.2f}, {r[2]:8.2f}] km | "
              f"v = [{v[0]:5.2f}, {v[1]:5.2f}, {v[2]:5.2f}] km/s")
    else:
        print(f"❌ Propagation error {error_code} at T+{offset_min}m")
        all_passed = False

if all_passed:
    print("\n🎉 DAY 1 VERIFICATION PASSED: Data is valid and SGP4 ready!")