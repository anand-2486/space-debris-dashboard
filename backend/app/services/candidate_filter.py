"""
candidate_filter.py — Member 3 (Algorithms & Risk)
"""

import math
from typing import Dict, List, Any
from app.services.propagator import PropagationResult


def filter_candidate_pairs(
    trajectories_by_id: Dict[int, List[PropagationResult]], 
    distance_threshold_km: float = 25.0
) -> List[Dict[str, Any]]:
    norad_ids = list(trajectories_by_id.keys())
    candidate_pairs = []

    for i in range(len(norad_ids)):
        for j in range(i + 1, len(norad_ids)):
            id_a, id_b = norad_ids[i], norad_ids[j]
            traj_a = trajectories_by_id[id_a]
            traj_b = trajectories_by_id[id_b]

            min_dist = float("inf")
            coarse_tca_idx = -1

            for idx, (res_a, res_b) in enumerate(zip(traj_a, traj_b)):
                if res_a.status != "ok" or res_b.status != "ok":
                    continue

                dx = res_a.x_km - res_b.x_km
                dy = res_a.y_km - res_b.y_km
                dz = res_a.z_km - res_b.z_km
                dist = math.sqrt(dx * dx + dy * dy + dz * dz)

                if dist < min_dist:
                    min_dist = dist
                    coarse_tca_idx = idx

            if min_dist <= distance_threshold_km and coarse_tca_idx != -1:
                candidate_pairs.append({
                    "norad_cat_id_a": id_a,
                    "norad_cat_id_b": id_b,
                    "coarse_tca_index": coarse_tca_idx,
                    "coarse_tca_timestamp": traj_a[coarse_tca_idx].timestamp_utc,
                    "coarse_min_distance_km": round(min_dist, 3)
                })

    return candidate_pairs