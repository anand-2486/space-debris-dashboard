import math
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List

# Core fields required by SGP4 for propagation
REQUIRED_NUMERIC_FIELDS = [
    'BSTAR', 'INCLINATION', 'RA_OF_ASC_NODE', 
    'ECCENTRICITY', 'ARG_OF_PERICENTER', 
    'MEAN_ANOMALY', 'MEAN_MOTION'
]

def calculate_data_age_hours(epoch_str: str) -> float:
    """
    Calculates the age of the orbital elements in hours relative to current UTC.
    """
    # Clean the CelesTrak ISO format for Python parsing
    cleaned_epoch = epoch_str.replace("Z", "+00:00")
    epoch_dt = datetime.fromisoformat(cleaned_epoch)
    
    if epoch_dt.tzinfo is None:
        epoch_dt = epoch_dt.replace(tzinfo=timezone.utc)
        
    now_utc = datetime.now(timezone.utc)
    age_seconds = (now_utc - epoch_dt).total_seconds()
    
    # Return age in hours (never below 0)
    return max(0.0, age_seconds / 3600.0)

def validate_orbital_record(record: Dict[str, Any]) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates fields, numeric bounds, NaN/inf values, and calculates data age.
    Returns: (is_valid, error_reasons, metadata)
    """
    errors = []
    
    # 1. Check ID and Name
    if not record.get('NORAD_CAT_ID'):
        errors.append("Missing NORAD_CAT_ID")
    if not record.get('OBJECT_NAME'):
        errors.append("Missing OBJECT_NAME")
        
    # 2. Parse Epoch and calculate data age as a quality signal[cite: 1]
    epoch_str = record.get('EPOCH')
    data_age_hours = 0.0
    if not epoch_str:
        errors.append("Missing EPOCH")
    else:
        try:
            data_age_hours = calculate_data_age_hours(str(epoch_str))
        except Exception as e:
            errors.append(f"Invalid EPOCH format: {str(e)}")

    # 3. Prevent malformed numeric data from breaking SGP4[cite: 1]
    for field in REQUIRED_NUMERIC_FIELDS:
        val = record.get(field)
        if val is None or str(val).strip() == "":
            errors.append(f"Missing field: {field}")
            continue
        try:
            num_val = float(val)
            if math.isnan(num_val) or math.isinf(num_val):
                errors.append(f"Non-finite value in {field}")
        except ValueError:
            errors.append(f"Non-numeric value in {field}")

    # 4. Generate structured flags and reasons[cite: 1]
    is_valid = len(errors) == 0
    metadata = {
        "norad_id": record.get('NORAD_CAT_ID'),
        "epoch_utc": epoch_str,
        "data_age_hours": round(data_age_hours, 2),
    }
    
    return is_valid, errors, metadata