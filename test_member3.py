"""
test_member3.py — Member 3 Verification Script
"""

from datetime import datetime, timezone, timedelta
import pandas as pd

from backend.app.services.propagator import propagate_batch, propagate_at
from backend.app.services.candidate_filter import filter_candidate_pairs
from backend.app.services.conjunction import refine_conjunction
from backend.app.services.risk import calculate_risk_score


def run_verification():
    print("--- 1. Testing Member 1 Data Load ---")
    df = pd.read_csv("data/demo_snapshot.csv")
    records = df.to_dict(orient="records")
    print(f"Loaded {len(records)} cached records from Member 1.")

    print("\n--- 2. Testing Member 2 Propagation ---")
    start_time = datetime.now(timezone.utc)
    coarse_timestamps = [start_time + timedelta(minutes=15 * i) for i in range(20)]
    trajectories_by_id, summary = propagate_batch(records[:20], coarse_timestamps)
    print(f"Propagated {summary.succeeded_objects} objects cleanly.")

    print("\n--- 3. Testing Member 3 Candidate Filtering ---")
    candidate_pairs = filter_candidate_pairs(trajectories_by_id, distance_threshold_km=5000.0)
    print(f"Candidate pairs found: {len(candidate_pairs)}")

    if candidate_pairs:
        pair = candidate_pairs[0]
        id_a, id_b = pair["norad_cat_id_a"], pair["norad_cat_id_b"]
        
        print(f"\n--- 4. Testing Member 3 Conjunction Refinement & Risk Scoring ---")
        coarse_tca_dt = datetime.fromisoformat(pair["coarse_tca_timestamp"].replace("Z", "+00:00"))
        fine_timestamps = [coarse_tca_dt + timedelta(minutes=m) for m in range(-5, 6)]

        rec_a = next(r for r in records if int(r["NORAD_CAT_ID"]) == id_a)
        rec_b = next(r for r in records if int(r["NORAD_CAT_ID"]) == id_b)

        fine_traj_a = propagate_at(rec_a, fine_timestamps)
        fine_traj_b = propagate_at(rec_b, fine_timestamps)

        conj_data = refine_conjunction(fine_traj_a, fine_traj_b)
        risk_data = calculate_risk_score(
            min_separation_km=conj_data["minimum_separation_km"],
            relative_velocity_kms=conj_data["relative_velocity_kms"],
            hours_to_tca=2.0,
            data_age_hours=0.5
        )

        print(f"Object A ({id_a}) vs Object B ({id_b})")
        print(f"Minimum Separation: {conj_data['minimum_separation_km']} km")
        print(f"Relative Velocity:  {conj_data['relative_velocity_kms']} km/s")
        print(f"Risk Score:         {risk_data['risk_score']} / 100 ({risk_data['severity']})")
        print(f"Telemetry Reasons:  {risk_data['reasons']}")

    print("\n--- Member 3 Verification Complete! ---")


if __name__ == "__main__":
    run_verification()
