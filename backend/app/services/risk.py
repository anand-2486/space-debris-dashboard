"""
risk.py — Member 3 (Algorithms & Risk)
"""

from typing import Dict, Any, List


def calculate_risk_score(
    min_separation_km: float, 
    relative_velocity_kms: float, 
    hours_to_tca: float, 
    data_age_hours: float
) -> Dict[str, Any]:
    sep_risk = max(0.0, 100.0 * (1.0 - (min_separation_km / 25.0)))
    vel_risk = min(100.0, (relative_velocity_kms / 15.0) * 100.0)
    urgency_risk = max(0.0, 100.0 * (1.0 - (hours_to_tca / 24.0)))
    freshness_score = max(0.0, 100.0 * (1.0 - (data_age_hours / 48.0)))

    raw_score = (0.55 * sep_risk) + (0.25 * vel_risk) + (0.15 * urgency_risk) + (0.05 * freshness_score)
    risk_score = int(round(max(0.0, min(100.0, raw_score))))

    if risk_score >= 80:
        severity = "CRITICAL"
    elif risk_score >= 60:
        severity = "HIGH"
    elif risk_score >= 35:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    confidence = int(round(freshness_score * 0.8 + 20))
    reasons: List[str] = []
    
    if min_separation_km < 5.0:
        reasons.append("Critical spatial separation (< 5km)")
    if relative_velocity_kms > 8.0:
        reasons.append("High relative velocity at approach (> 8km/s)")
    if hours_to_tca < 6.0:
        reasons.append("Near-term TCA event (< 6h)")
    if data_age_hours > 24.0:
        reasons.append("Stale orbital data source (> 24h old)")

    return {
        "risk_score": risk_score,
        "severity": severity,
        "confidence": confidence,
        "reasons": reasons if reasons else ["Nominal orbital tracking"]
    }
