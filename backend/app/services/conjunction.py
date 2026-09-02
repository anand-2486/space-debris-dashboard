"""
conjunction.py — Member 3 (Algorithms & Risk)
"""

import math
from typing import List, Dict, Any
from app.services.propagator import PropagationResult


def refine_conjunction(
    fine_traj_a: List[PropagationResult], 
    fine_traj_b: List[PropagationResult]
) -> Dict[str, Any]:
    min_dist = float("inf")
    tca_idx = -1
    distance_curve = []

    for idx, (res_a, res_b) in enumerate(zip(fine_traj_a, fine_traj_b)):
        if res_a.status != "ok" or res_b.status != "ok":
            distance_curve.append(None)
            continue

        dx = res_a.x_km - res_b.x_km
        dy = res_a.y_km - res_b.y_km
        dz = res_a.z_km - res_b.z_km
        dist = math.sqrt(dx * dx + dy * dy + dz * dz)
        
        distance_curve.append(round(dist, 3))
        if dist < min_dist:
            min_dist = dist
            tca_idx = idx

    if tca_idx == -1:
        raise ValueError("No valid propagation steps found during fine refinement.")

    res_a_tca = fine_traj_a[tca_idx]
    res_b_tca = fine_traj_b[tca_idx]

    dvx = res_a_tca.vx_km_s - res_b_tca.vx_km_s
    dvy = res_a_tca.vy_km_s - res_b_tca.vy_km_s
    dvz = res_a_tca.vz_km_s - res_b_tca.vz_km_s
    relative_velocity_kms = math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz)

    return {
        "tca_timestamp": res_a_tca.timestamp_utc,
        "minimum_separation_km": round(min_dist, 3),
        "relative_velocity_kms": round(relative_velocity_kms, 3),
        "distance_curve": distance_curve
    }
