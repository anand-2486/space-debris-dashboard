"""
propagator.py — Member 2 (Propagation Lead)

Owns: converting ONE normalized orbital record (produced by Member 1's
ingestion pipeline) into position/velocity vectors at any list of UTC
timestamps, using SGP4.

Design rules (Day 0 contract — do not violate without team agreement):
  - Input record fields and units are fixed below in ORBITAL_RECORD_FIELDS.
  - Output units are fixed: km for position, km/s for velocity.
  - Every result carries an explicit status: "ok" | "error", never a silent
    NaN. Downstream (Member 3, Member 4) must be able to trust "ok" values
    completely and must be able to detect + skip "error" values.
  - This module has NO knowledge of FastAPI, the database, or the frontend.
    It is a pure function library so Member 4 can call it from a script,
    a background job, or an API route without modification.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Iterable

from sgp4.api import Satrec, WGS72, jday


# ---------------------------------------------------------------------------
# INPUT CONTRACT
# ---------------------------------------------------------------------------
# This is the exact set of fields Member 1's ingestion/normalization layer
# must guarantee for every usable record. Agreed with Member 1 on Day 0.
#
#   NORAD_CAT_ID        int    stable catalog / object ID
#   OBJECT_NAME          str    display name
#   EPOCH                str    ISO-8601 UTC, e.g. "2026-08-25T12:00:00.000Z"
#   BSTAR                float  drag term
#   INCLINATION          float  degrees
#   RA_OF_ASC_NODE       float  degrees   (RAAN / node)
#   ECCENTRICITY         float  unitless (0..1)
#   ARG_OF_PERICENTER    float  degrees
#   MEAN_ANOMALY         float  degrees
#   MEAN_MOTION          float  revolutions / day
#   SOURCE_URL            str    provenance (not used by propagator)
#   RETRIEVED_AT          str    provenance (not used by propagator)
#
# This matches Member 1's demo_snapshot.csv / sample.csv exactly, so no
# translation layer is needed between ingestion and propagation.

ORBITAL_RECORD_FIELDS = [
    "NORAD_CAT_ID",
    "OBJECT_NAME",
    "EPOCH",
    "BSTAR",
    "INCLINATION",
    "RA_OF_ASC_NODE",
    "ECCENTRICITY",
    "ARG_OF_PERICENTER",
    "MEAN_ANOMALY",
    "MEAN_MOTION",
]

DEG2RAD = math.pi / 180.0


@dataclass
class PropagationResult:
    """One (object, timestamp) result. Never partially filled: if status
    is 'error', x/y/z/vx/vy/vz are all None."""
    norad_cat_id: int
    timestamp_utc: str
    x_km: float | None
    y_km: float | None
    z_km: float | None
    vx_km_s: float | None
    vy_km_s: float | None
    vz_km_s: float | None
    status: str          # "ok" | "error"
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "norad_cat_id": self.norad_cat_id,
            "timestamp_utc": self.timestamp_utc,
            "x_km": self.x_km,
            "y_km": self.y_km,
            "z_km": self.z_km,
            "vx_km_s": self.vx_km_s,
            "vy_km_s": self.vy_km_s,
            "vz_km_s": self.vz_km_s,
            "status": self.status,
            "error": self.error,
        }


class RecordValidationError(ValueError):
    """Raised when an orbital record is missing required fields."""


def _validate_record(record: dict) -> None:
    missing = [f for f in ORBITAL_RECORD_FIELDS if f not in record or record[f] in (None, "")]
    if missing:
        raise RecordValidationError(f"Record missing required fields: {missing}")


def build_satellite(record: dict) -> Satrec:
    """
    Build a Satrec object directly from OMM-style orbital elements
    (NOT two-line TLE strings — our data comes from Member 1 as
    normalized OMM/GP fields, so we initialize sgp4 with sgp4init()
    rather than twoline2rv()).

    Raises RecordValidationError if required fields are missing.
    Raises ValueError if fields cannot be parsed as numbers or the
    epoch cannot be parsed.
    """
    _validate_record(record)

    epoch_str = record["EPOCH"]
    try:
        epoch_str_clean = epoch_str.replace("Z", "+00:00")
        epoch_dt = datetime.fromisoformat(epoch_str_clean)
        if epoch_dt.tzinfo is None:
            epoch_dt = epoch_dt.replace(tzinfo=timezone.utc)
    except Exception as e:
        raise ValueError(f"Unparseable EPOCH '{epoch_str}': {e}")

    jd, fr = jday(
        epoch_dt.year, epoch_dt.month, epoch_dt.day,
        epoch_dt.hour, epoch_dt.minute,
        epoch_dt.second + epoch_dt.microsecond / 1e6,
    )
    sgp4_epoch = (jd + fr) - 2433281.5  # days since 1949-12-31 00:00 UT

    sat = Satrec()
    sat.sgp4init(
        WGS72,                                   # gravity model
        "i",                                     # 'i' = improved (afspc) mode
        int(record["NORAD_CAT_ID"]),              # satnum
        sgp4_epoch,                               # epoch
        float(record["BSTAR"]),                   # bstar drag term
        0.0,                                       # ndot (unused by SGP4, legacy)
        0.0,                                       # nddot (unused by SGP4, legacy)
        float(record["ECCENTRICITY"]),             # eccentricity
        float(record["ARG_OF_PERICENTER"]) * DEG2RAD,  # argument of perigee (rad)
        float(record["INCLINATION"]) * DEG2RAD,         # inclination (rad)
        float(record["MEAN_ANOMALY"]) * DEG2RAD,         # mean anomaly (rad)
        float(record["MEAN_MOTION"]) * 2 * math.pi / 1440.0,  # rev/day -> rad/min
        float(record["RA_OF_ASC_NODE"]) * DEG2RAD,        # RAAN (rad)
    )
    return sat


def propagate_at(record: dict, timestamps_utc: Iterable[datetime]) -> list[PropagationResult]:
    """
    Propagate ONE object to a list of UTC datetimes.

    This is the Day 0 required entry point:
        one orbital record + UTC timestamps -> x,y,z (km), vx,vy,vz (km/s),
        epoch, status/error

    Never raises for per-timestamp SGP4 failures — those become
    PropagationResult(status="error"). It DOES raise RecordValidationError
    / ValueError if the record itself is unusable (that's a data problem,
    not a propagation problem, and should be caught before this is called
    at scale).
    """
    norad_id = int(record["NORAD_CAT_ID"])
    sat = build_satellite(record)  # raises early if record is bad

    results: list[PropagationResult] = []
    for ts in timestamps_utc:
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        ts_iso = ts.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        jd, fr = jday(ts.year, ts.month, ts.day, ts.hour, ts.minute,
                       ts.second + ts.microsecond / 1e6)
        error_code, r, v = sat.sgp4(jd, fr)

        if error_code != 0:
            results.append(PropagationResult(
                norad_cat_id=norad_id,
                timestamp_utc=ts_iso,
                x_km=None, y_km=None, z_km=None,
                vx_km_s=None, vy_km_s=None, vz_km_s=None,
                status="error",
                error=f"sgp4_error_code_{error_code}",
            ))
            continue

        if not all(math.isfinite(c) for c in (*r, *v)):
            results.append(PropagationResult(
                norad_cat_id=norad_id,
                timestamp_utc=ts_iso,
                x_km=None, y_km=None, z_km=None,
                vx_km_s=None, vy_km_s=None, vz_km_s=None,
                status="error",
                error="non_finite_output",
            ))
            continue

        results.append(PropagationResult(
            norad_cat_id=norad_id,
            timestamp_utc=ts_iso,
            x_km=r[0], y_km=r[1], z_km=r[2],
            vx_km_s=v[0], vy_km_s=v[1], vz_km_s=v[2],
            status="ok",
            error=None,
        ))

    return results


def propagate_offsets_minutes(record: dict, base_time_utc: datetime,
                               offsets_minutes: Iterable[float]) -> list[PropagationResult]:
    """Convenience wrapper for the Day-0/Day-1 acceptance test:
    'known object at now / +10 / +20 / +30 minutes'."""
    from datetime import timedelta
    timestamps = [base_time_utc + timedelta(minutes=m) for m in offsets_minutes]
    return propagate_at(record, timestamps)


@dataclass
class BatchPropagationSummary:
    """Day 2 deliverable: batch run metadata for benchmarking / handoff to
    Member 3 and Member 6 (runtime evidence)."""
    object_count: int
    timestamps_per_object: int
    total_points: int
    succeeded_objects: int
    failed_objects: int
    runtime_seconds: float
    failed_object_ids: list[int] = field(default_factory=list)


def propagate_batch(records: list[dict],
                     timestamps_utc: list[datetime]) -> tuple[dict[int, list[PropagationResult]], BatchPropagationSummary]:
    """
    Day 2 required entry point: object LIST + time grid -> trajectory arrays.

    Propagates every record in `records` across the same list of timestamps.
    A record that fails validation (bad/missing fields) does NOT crash the
    whole batch — it is skipped and recorded in the summary's
    failed_object_ids, so Member 3's candidate filter never silently loses
    track of which objects are missing from the results.

    Returns:
        (results_by_id, summary)
        results_by_id: {norad_cat_id: [PropagationResult, ...]} — one list
            per successfully-processed object, one PropagationResult per
            timestamp (each individually may still be status="error" if
            SGP4 itself failed at that specific instant).
        summary: BatchPropagationSummary with counts and measured runtime,
            for benchmarking / PPT evidence.
    """
    import time as _time

    start = _time.time()
    results_by_id: dict[int, list[PropagationResult]] = {}
    failed_ids: list[int] = []

    for record in records:
        norad_id = int(record.get("NORAD_CAT_ID", -1))
        try:
            results_by_id[norad_id] = propagate_at(record, timestamps_utc)
        except (RecordValidationError, ValueError):
            # Bad record (missing field / unparseable epoch) — skip, don't crash the batch.
            failed_ids.append(norad_id)
            continue

    elapsed = _time.time() - start

    summary = BatchPropagationSummary(
        object_count=len(records),
        timestamps_per_object=len(timestamps_utc),
        total_points=sum(len(v) for v in results_by_id.values()),
        succeeded_objects=len(results_by_id),
        failed_objects=len(failed_ids),
        runtime_seconds=round(elapsed, 4),
        failed_object_ids=failed_ids,
    )
    return results_by_id, summary
