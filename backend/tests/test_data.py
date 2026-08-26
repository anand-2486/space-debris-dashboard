import pytest
from app.services.validation import validate_orbital_record

def test_valid_record_passes():
    valid_record = {
        "NORAD_CAT_ID": 25544,
        "OBJECT_NAME": "ISS (ZARYA)",
        "EPOCH": "2026-08-25T12:00:00.000Z",
        "BSTAR": 0.000146,
        "INCLINATION": 51.64,
        "RA_OF_ASC_NODE": 102.34,
        "ECCENTRICITY": 0.0004,
        "ARG_OF_PERICENTER": 75.23,
        "MEAN_ANOMALY": 28.34,
        "MEAN_MOTION": 15.49
    }
    is_valid, errors, meta = validate_orbital_record(valid_record)
    
    assert is_valid is True
    assert len(errors) == 0
    assert meta["data_age_hours"] >= 0.0

def test_nan_values_are_rejected():
    bad_record = {
        "NORAD_CAT_ID": 33000,
        "OBJECT_NAME": "COSMOS 2251 DEB",
        "EPOCH": "2026-08-25T12:00:00.000Z",
        "BSTAR": float("nan"),  # Broken math value
        "INCLINATION": 74.0,
        "RA_OF_ASC_NODE": 50.0,
        "ECCENTRICITY": 0.002,
        "ARG_OF_PERICENTER": 120.0,
        "MEAN_ANOMALY": 45.0,
        "MEAN_MOTION": 14.32
    }
    is_valid, errors, _ = validate_orbital_record(bad_record)
    
    assert is_valid is False
    assert any("Non-finite value in BSTAR" in err for err in errors)

def test_missing_epoch_fails():
    bad_record = {
        "NORAD_CAT_ID": 33001,
        "OBJECT_NAME": "IRIDIUM 33 DEB",
        # EPOCH intentionally missing
        "BSTAR": 0.000210,
        "INCLINATION": 86.0,
        "RA_OF_ASC_NODE": 45.0,
        "ECCENTRICITY": 0.0021,
        "ARG_OF_PERICENTER": 110.0,
        "MEAN_ANOMALY": 40.0,
        "MEAN_MOTION": 14.34
    }
    is_valid, errors, _ = validate_orbital_record(bad_record)
    
    assert is_valid is False
    assert any("Missing EPOCH" in err for err in errors)