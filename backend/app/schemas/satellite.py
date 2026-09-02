from pydantic import BaseModel
from typing import Optional


class Satellite(BaseModel):
    norad_cat_id: int
    object_name: str
    epoch_utc: str

    bstar: Optional[float] = None
    inclination: Optional[float] = None
    ra_of_asc_node: Optional[float] = None
    eccentricity: Optional[float] = None
    arg_of_pericenter: Optional[float] = None
    mean_anomaly: Optional[float] = None
    mean_motion: Optional[float] = None

    source_url: Optional[str] = None
    retrieved_at: Optional[str] = None