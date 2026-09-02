import sqlite3

from app.core.database import DB_PATH, init_db


def test_satellite_insert_and_read():
    init_db()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    satellite = (
        999999,
        "TEST SATELLITE",
        "2026-08-28T12:00:00Z",
        0.0001,
        51.6,
        100.0,
        0.0004,
        75.0,
        28.0,
        15.5,
        "test://source",
        "2026-08-28T12:00:00Z",
    )

    cursor.execute(
        """
        INSERT OR REPLACE INTO satellites (
            norad_cat_id,
            object_name,
            epoch_utc,
            bstar,
            inclination,
            ra_of_asc_node,
            eccentricity,
            arg_of_pericenter,
            mean_anomaly,
            mean_motion,
            source_url,
            retrieved_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        satellite,
    )

    conn.commit()

    cursor.execute(
        "SELECT object_name FROM satellites WHERE norad_cat_id = ?",
        (999999,),
    )

    result = cursor.fetchone()

    conn.close()

    assert result is not None
    assert result[0] == "TEST SATELLITE"


def test_conjunction_insert_and_read():
    init_db()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO conjunctions (
            object_a,
            object_b,
            tca_timestamp,
            minimum_separation_km,
            relative_velocity_kms,
            risk_score,
            severity,
            confidence,
            reasons
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "TEST SATELLITE A",
            "TEST SATELLITE B",
            "2026-08-28T12:00:00Z",
            4.2,
            9.1,
            87,
            "CRITICAL",
            95,
            "Critical spatial separation (< 5km)",
        ),
    )

    conn.commit()

    cursor.execute(
        """
        SELECT object_a, object_b, risk_score, severity
        FROM conjunctions
        WHERE object_a = ?
        """,
        ("TEST SATELLITE A",),
    )

    result = cursor.fetchone()

    conn.close()

    assert result is not None
    assert result[0] == "TEST SATELLITE A"
    assert result[1] == "TEST SATELLITE B"
    assert result[2] == 87
    assert result[3] == "CRITICAL"