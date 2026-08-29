import sqlite3
import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Query
from pathlib import Path

from app.services.propagator import propagate_at, RecordValidationError


router = APIRouter(prefix="/api")


# ---------------------------------------------------------
# DATABASE PATH
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DB_PATH = PROJECT_ROOT / "backend" / "space_debris.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------

@router.get("/health")
def health_check():
    return {
        "status": "ok"
    }


# ---------------------------------------------------------
# DASHBOARD SUMMARY
# ---------------------------------------------------------

@router.get("/dashboard")
def dashboard_summary():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM satellites")
    satellite_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM conjunctions")
    conjunction_count = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM conjunctions WHERE severity = 'CRITICAL'"
    )
    critical_count = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM conjunctions WHERE severity = 'HIGH'"
    )
    high_count = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM conjunctions WHERE severity = 'MEDIUM'"
    )
    medium_count = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM conjunctions WHERE severity = 'LOW'"
    )
    low_count = cursor.fetchone()[0]

    conn.close()

    return {
        "satellite_count": satellite_count,
        "conjunction_count": conjunction_count,
        "severity_counts": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count
        }
    }


# ---------------------------------------------------------
# SATELLITES — LIST
# ---------------------------------------------------------

@router.get("/satellites")
def get_satellites(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):

    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            norad_cat_id,
            object_name,
            epoch_utc,
            inclination,
            eccentricity,
            mean_motion
        FROM satellites
        ORDER BY norad_cat_id
        LIMIT ? OFFSET ?
        """,
        (limit, offset)
    )

    rows = cursor.fetchall()

    conn.close()

    return {
        "count": len(rows),
        "satellites": [dict(row) for row in rows]
    }


# ---------------------------------------------------------
# SATELLITES — DETAIL
# ---------------------------------------------------------

@router.get("/satellites/{norad_cat_id}")
def get_satellite(norad_cat_id: int):

    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM satellites
        WHERE norad_cat_id = ?
        """,
        (norad_cat_id,)
    )

    row = cursor.fetchone()

    conn.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Satellite not found"
        )

    return dict(row)


# ---------------------------------------------------------
# SATELLITES — TRAJECTORY
# ---------------------------------------------------------

@router.get("/satellites/{norad_cat_id}/trajectory")
def get_satellite_trajectory(norad_cat_id: int):

    # -----------------------------------------------------
    # 1. Fetch orbital data from database
    # -----------------------------------------------------

    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM satellites
        WHERE norad_cat_id = ?
        """,
        (norad_cat_id,)
    )

    row = cursor.fetchone()

    conn.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Satellite not found"
        )

    satellite = dict(row)

    # -----------------------------------------------------
    # 2. Convert DB record into propagator input format
    # -----------------------------------------------------

    record = {
        "NORAD_CAT_ID": satellite["norad_cat_id"],
        "OBJECT_NAME": satellite["object_name"],
        "EPOCH": satellite["epoch_utc"],
        "BSTAR": satellite["bstar"],
        "INCLINATION": satellite["inclination"],
        "RA_OF_ASC_NODE": satellite["ra_of_asc_node"],
        "ECCENTRICITY": satellite["eccentricity"],
        "ARG_OF_PERICENTER": satellite["arg_of_pericenter"],
        "MEAN_ANOMALY": satellite["mean_anomaly"],
        "MEAN_MOTION": satellite["mean_motion"],
    }

    # -----------------------------------------------------
    # 3. Generate timestamps
    #
    # 24-hour trajectory
    # 5-minute intervals
    #
    # 24 * 60 / 5 = 288 intervals
    # Including starting point = 289 points
    # -----------------------------------------------------

    start_time = datetime.now(timezone.utc)

    timestamps = [
        start_time + timedelta(minutes=5 * i)
        for i in range(289)
    ]

    # -----------------------------------------------------
    # 4. Propagate satellite
    # -----------------------------------------------------

    try:
        results = propagate_at(
            record,
            timestamps
        )

    except (RecordValidationError, ValueError, TypeError) as e:

        raise HTTPException(
            status_code=500,
            detail=f"Propagation failed: {str(e)}"
        )

    # -----------------------------------------------------
    # 5. Convert propagation results into API trajectory
    # -----------------------------------------------------

    trajectory = []

    for result in results:

        if result.status != "ok":
            continue

        trajectory.append({
            "timestamp_utc": result.timestamp_utc,
            "x_km": result.x_km,
            "y_km": result.y_km,
            "z_km": result.z_km,
            "vx_km_s": result.vx_km_s,
            "vy_km_s": result.vy_km_s,
            "vz_km_s": result.vz_km_s
        })

    # -----------------------------------------------------
    # 6. Return plot-ready trajectory
    # -----------------------------------------------------

    return {
        "norad_cat_id": norad_cat_id,
        "trajectory": trajectory
    }


# ---------------------------------------------------------
# CONJUNCTIONS — LIST
# ---------------------------------------------------------

@router.get("/conjunctions")
def get_conjunctions(
    severity: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):

    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if severity is not None:

        severity = severity.upper()

        cursor.execute(
            """
            SELECT *
            FROM conjunctions
            WHERE severity = ?
            ORDER BY risk_score DESC
            LIMIT ? OFFSET ?
            """,
            (severity, limit, offset)
        )

    else:

        cursor.execute(
            """
            SELECT *
            FROM conjunctions
            ORDER BY risk_score DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset)
        )

    rows = cursor.fetchall()

    conn.close()

    return {
        "count": len(rows),
        "conjunctions": [dict(row) for row in rows]
    }


# ---------------------------------------------------------
# CONJUNCTIONS — DETAIL
# ---------------------------------------------------------

@router.get("/conjunctions/{conjunction_id}")
def get_conjunction(conjunction_id: int):

    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM conjunctions
        WHERE id = ?
        """,
        (conjunction_id,)
    )

    row = cursor.fetchone()

    conn.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Conjunction not found"
        )

    return dict(row)


# ---------------------------------------------------------
# CONJUNCTIONS — TRAJECTORY
# ---------------------------------------------------------

@router.get("/conjunctions/{conjunction_id}/trajectory")
def get_conjunction_trajectory(conjunction_id: int):

    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # ---------------------------------------------------------
    # Get conjunction details
    # ---------------------------------------------------------

    cursor.execute(
        """
        SELECT
            id,
            object_a,
            object_b,
            tca_timestamp,
            distance_curve
        FROM conjunctions
        WHERE id = ?
        """,
        (conjunction_id,)
    )

    conjunction_row = cursor.fetchone()

    if conjunction_row is None:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail="Conjunction not found"
        )

    conjunction = dict(conjunction_row)

    # ---------------------------------------------------------
    # Get satellite records for both objects
    # ---------------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM satellites
        WHERE object_name = ?
        """,
        (conjunction["object_a"],)
    )

    satellite_a_row = cursor.fetchone()

    cursor.execute(
        """
        SELECT *
        FROM satellites
        WHERE object_name = ?
        """,
        (conjunction["object_b"],)
    )

    satellite_b_row = cursor.fetchone()

    conn.close()

    if satellite_a_row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Satellite not found: {conjunction['object_a']}"
        )

    if satellite_b_row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Satellite not found: {conjunction['object_b']}"
        )

    satellite_a = dict(satellite_a_row)
    satellite_b = dict(satellite_b_row)

    # ---------------------------------------------------------
    # Build records expected by propagator
    # ---------------------------------------------------------

    record_a = {
        "NORAD_CAT_ID": satellite_a["norad_cat_id"],
        "OBJECT_NAME": satellite_a["object_name"],
        "EPOCH": satellite_a["epoch_utc"],
        "BSTAR": satellite_a["bstar"],
        "INCLINATION": satellite_a["inclination"],
        "RA_OF_ASC_NODE": satellite_a["ra_of_asc_node"],
        "ECCENTRICITY": satellite_a["eccentricity"],
        "ARG_OF_PERICENTER": satellite_a["arg_of_pericenter"],
        "MEAN_ANOMALY": satellite_a["mean_anomaly"],
        "MEAN_MOTION": satellite_a["mean_motion"],
    }

    record_b = {
        "NORAD_CAT_ID": satellite_b["norad_cat_id"],
        "OBJECT_NAME": satellite_b["object_name"],
        "EPOCH": satellite_b["epoch_utc"],
        "BSTAR": satellite_b["bstar"],
        "INCLINATION": satellite_b["inclination"],
        "RA_OF_ASC_NODE": satellite_b["ra_of_asc_node"],
        "ECCENTRICITY": satellite_b["eccentricity"],
        "ARG_OF_PERICENTER": satellite_b["arg_of_pericenter"],
        "MEAN_ANOMALY": satellite_b["mean_anomaly"],
        "MEAN_MOTION": satellite_b["mean_motion"],
    }

    # ---------------------------------------------------------
    # Build 24-hour window centered around TCA
    # ---------------------------------------------------------

    try:
        tca = datetime.fromisoformat(
            conjunction["tca_timestamp"].replace("Z", "+00:00")
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=500,
            detail="Invalid TCA timestamp"
        )

    if tca.tzinfo is None:
        tca = tca.replace(tzinfo=timezone.utc)

    start_time = tca - timedelta(hours=12)

    timestamps = [
        start_time + timedelta(minutes=5 * i)
        for i in range(289)
    ]

    # ---------------------------------------------------------
    # Propagate both satellites
    # ---------------------------------------------------------

    try:
        results_a = propagate_at(record_a, timestamps)
        results_b = propagate_at(record_b, timestamps)

    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Propagation failed: {str(e)}"
        )

    # ---------------------------------------------------------
    # Format trajectories
    # ---------------------------------------------------------

    trajectory_a = [
        {
            "timestamp_utc": result.timestamp_utc,
            "x_km": result.x_km,
            "y_km": result.y_km,
            "z_km": result.z_km,
            "vx_km_s": result.vx_km_s,
            "vy_km_s": result.vy_km_s,
            "vz_km_s": result.vz_km_s,
        }
        for result in results_a
        if result.status == "ok"
    ]

    trajectory_b = [
        {
            "timestamp_utc": result.timestamp_utc,
            "x_km": result.x_km,
            "y_km": result.y_km,
            "z_km": result.z_km,
            "vx_km_s": result.vx_km_s,
            "vy_km_s": result.vy_km_s,
            "vz_km_s": result.vz_km_s,
        }
        for result in results_b
        if result.status == "ok"
    ]

    # ---------------------------------------------------------
    # Decode stored distance curve
    # ---------------------------------------------------------

    try:
        distance_curve = (
            json.loads(conjunction["distance_curve"])
            if conjunction["distance_curve"]
            else []
        )
    except (json.JSONDecodeError, TypeError):
        distance_curve = []

    # ---------------------------------------------------------
    # Return complete conjunction trajectory response
    # ---------------------------------------------------------

    return {
        "conjunction_id": conjunction["id"],
        "object_a": conjunction["object_a"],
        "object_b": conjunction["object_b"],
        "tca_timestamp": conjunction["tca_timestamp"],
        "trajectory_a": trajectory_a,
        "trajectory_b": trajectory_b,
        "distance_curve": distance_curve
    }