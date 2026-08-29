"""
orchestrator.py — Member 4
Science Pipeline Orchestration

Pipeline:
    normalized data
        -> coarse propagation
        -> candidate filtering
        -> fine propagation
        -> conjunction refinement
        -> risk scoring
"""

from typing import Any, Dict, List
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from app.services.propagator import propagate_batch
from app.services.candidate_filter import filter_candidate_pairs
from app.services.conjunction import refine_conjunction
from app.services.risk import calculate_risk_score
from app.services.validation import calculate_data_age_hours


def run_pipeline() -> Dict[str, Any]:
    """
    Executes the complete backend science pipeline.
    """

    print("[ORCHESTRATOR] Starting pipeline...")

    # =========================================================
    # 1. Load normalized dataset
    # =========================================================

    PROJECT_ROOT = Path(__file__).resolve().parents[3]
    DATA_PATH = PROJECT_ROOT / "data" / "processed" / "objects.csv"

    df = pd.read_csv(DATA_PATH)
    records = df.to_dict(orient="records")

    print(
        f"[ORCHESTRATOR] Loaded "
        f"{len(records)} normalized objects."
    )

    # Map NORAD ID -> original normalized record
    records_by_id = {
        int(record["NORAD_CAT_ID"]): record
        for record in records
    }

    # =========================================================
    # 2. Create coarse propagation time grid
    # =========================================================

    base_time = datetime.now(timezone.utc)

    coarse_timestamps = [
        base_time + timedelta(minutes=10 * i)
        for i in range(4)
    ]

    print(
        f"[ORCHESTRATOR] Propagating at "
        f"{len(coarse_timestamps)} coarse timestamps."
    )

    # =========================================================
    # 3. Coarse propagation
    # =========================================================

    results_by_id, propagation_summary = propagate_batch(
        records,
        coarse_timestamps
    )

    print(
        f"[ORCHESTRATOR] Propagation complete: "
        f"{propagation_summary.succeeded_objects} succeeded, "
        f"{propagation_summary.failed_objects} failed."
    )

    # =========================================================
    # 4. Candidate filtering
    # =========================================================

    print("[ORCHESTRATOR] Running candidate filtering...")

    candidate_pairs = filter_candidate_pairs(
        results_by_id,
        distance_threshold_km=25.0
    )

    print(
        f"[ORCHESTRATOR] Candidate filtering complete: "
        f"{len(candidate_pairs)} candidate pairs found."
    )

    # =========================================================
    # 5. Fine propagation + conjunction refinement
    # =========================================================

    conjunction_results: List[Dict[str, Any]] = []

    print(
        f"[ORCHESTRATOR] Refining "
        f"{len(candidate_pairs)} candidate pairs..."
    )

    for candidate in candidate_pairs:

        id_a = int(candidate["norad_cat_id_a"])
        id_b = int(candidate["norad_cat_id_b"])

        coarse_tca = candidate["coarse_tca_timestamp"]

        # -----------------------------------------------------
        # Fine propagation window
        # -----------------------------------------------------
        #
        # 21 points:
        #   TCA - 10 min
        #   ...
        #   TCA
        #   ...
        #   TCA + 10 min
        #
        # 1-minute resolution
        # -----------------------------------------------------

        fine_timestamps = [
            coarse_tca + timedelta(minutes=offset)
            for offset in range(-10, 11)
        ]

        records_for_pair = [
            records_by_id[id_a],
            records_by_id[id_b]
        ]

        fine_results_by_id, fine_summary = propagate_batch(
            records_for_pair,
            fine_timestamps
        )

        fine_traj_a = fine_results_by_id.get(id_a, [])
        fine_traj_b = fine_results_by_id.get(id_b, [])

        if not fine_traj_a or not fine_traj_b:
            print(
                f"[ORCHESTRATOR] Fine propagation failed for "
                f"pair {id_a}-{id_b}."
            )
            continue

        # -----------------------------------------------------
        # Conjunction refinement
        # -----------------------------------------------------

        try:
            conjunction = refine_conjunction(
                fine_traj_a,
                fine_traj_b
            )
        except ValueError as exc:
            print(
                f"[ORCHESTRATOR] Conjunction refinement failed "
                f"for pair {id_a}-{id_b}: {exc}"
            )
            continue

        # =====================================================
        # 6. Calculate risk
        # =====================================================

        tca_timestamp = conjunction["tca_timestamp"]

        # Ensure timezone-aware datetime
        if tca_timestamp.tzinfo is None:
            tca_timestamp = tca_timestamp.replace(
                tzinfo=timezone.utc
            )

        now_utc = datetime.now(timezone.utc)

        hours_to_tca = (
            tca_timestamp - now_utc
        ).total_seconds() / 3600.0

        # Risk model expects hours until TCA.
        # If TCA has already passed, treat urgency as maximum.
        hours_to_tca = max(0.0, hours_to_tca)

        # -----------------------------------------------------
        # Data age
        # -----------------------------------------------------

        epoch_a = str(records_by_id[id_a]["EPOCH"])
        epoch_b = str(records_by_id[id_b]["EPOCH"])

        age_a = calculate_data_age_hours(epoch_a)
        age_b = calculate_data_age_hours(epoch_b)

        # Use the older data source for conservative confidence.
        data_age_hours = max(age_a, age_b)

        risk = calculate_risk_score(
            min_separation_km=conjunction[
                "minimum_separation_km"
            ],
            relative_velocity_kms=conjunction[
                "relative_velocity_kms"
            ],
            hours_to_tca=hours_to_tca,
            data_age_hours=data_age_hours
        )

        # =====================================================
        # 7. Build final conjunction event
        # =====================================================

        conjunction_results.append({
            "norad_cat_id_a": id_a,
            "norad_cat_id_b": id_b,

            # Coarse-stage information
            "coarse_tca_timestamp":
                candidate["coarse_tca_timestamp"],
            "coarse_min_distance_km":
                candidate["coarse_min_distance_km"],

            # Fine-stage conjunction information
            "tca_timestamp":
                conjunction["tca_timestamp"],
            "minimum_separation_km":
                conjunction["minimum_separation_km"],
            "relative_velocity_kms":
                conjunction["relative_velocity_kms"],
            "distance_curve":
                conjunction["distance_curve"],

            # Risk information
            "hours_to_tca":
                round(hours_to_tca, 3),
            "data_age_hours":
                round(data_age_hours, 2),
            "risk_score":
                risk["risk_score"],
            "severity":
                risk["severity"],
            "confidence":
                risk["confidence"],
            "reasons":
                risk["reasons"],
        })

    # =========================================================
    # 8. Pipeline summary
    # =========================================================

    print(
        f"[ORCHESTRATOR] Conjunction refinement complete: "
        f"{len(conjunction_results)} events."
    )

    pipeline_summary = {
        "object_count":
            propagation_summary.object_count,

        "coarse_timestamps_per_object":
            propagation_summary.timestamps_per_object,

        "coarse_total_points":
            propagation_summary.total_points,

        "succeeded_objects":
            propagation_summary.succeeded_objects,

        "failed_objects":
            propagation_summary.failed_objects,

        "runtime_seconds":
            propagation_summary.runtime_seconds,

        "failed_object_ids":
            propagation_summary.failed_object_ids,

        "candidate_count":
            len(candidate_pairs),

        "conjunction_count":
            len(conjunction_results),
    }

    # =========================================================
    # 9. Return complete pipeline result
    # =========================================================

    return {
        "status": "success",

        "propagation_summary": pipeline_summary,

        "candidate_pairs": candidate_pairs,

        "conjunction_results": conjunction_results,
    }


# =============================================================
# Standalone execution
# =============================================================

if __name__ == "__main__":

    result = run_pipeline()

    print()
    print("========== PIPELINE SUMMARY ==========")
    print(result["propagation_summary"])
    print(
        f"Candidate pairs: "
        f"{result['propagation_summary']['candidate_count']}"
    )
    print(
        f"Refined conjunctions: "
        f"{result['propagation_summary']['conjunction_count']}"
    )

    # Print detailed events if any were found
    if result["conjunction_results"]:

        print()
        print("========== CONJUNCTION EVENTS ==========")

        for event in result["conjunction_results"]:
            print()
            print(
                f"Pair: "
                f"{event['norad_cat_id_a']} - "
                f"{event['norad_cat_id_b']}"
            )
            print(
                f"TCA: "
                f"{event['tca_timestamp']}"
            )
            print(
                f"Minimum separation: "
                f"{event['minimum_separation_km']} km"
            )
            print(
                f"Relative velocity: "
                f"{event['relative_velocity_kms']} km/s"
            )
            print(
                f"Risk score: "
                f"{event['risk_score']}"
            )
            print(
                f"Severity: "
                f"{event['severity']}"
            )
            print(
                f"Confidence: "
                f"{event['confidence']}"
            )
            print(
                f"Reasons: "
                f"{event['reasons']}"
            )