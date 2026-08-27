from pydantic import BaseModel
from typing import List
from datetime import datetime


class Conjunction(BaseModel):
    object_a: str
    object_b: str

    tca_timestamp: datetime
    minimum_separation_km: float
    relative_velocity_kms: float

    risk_score: float
    severity: str
    confidence: float

    reasons: List[str]