from datetime import datetime 
from typing import Optional
from pydantic import BaseModel 

class NormalizedOffer(BaseModel):
    source: str = "welovedevs"
    source_id: str

    title: str
    description: str
    company: Optional[str] = None

    location_city: Optional[str] = None
    location_country: Optional[str] = None
    remote_policy: str = "unknown"   # onsite, hybrid, remote, unknown

    contract_type: str = "unknown"   # internship, apprenticeship, full_time, freelance, unknown

    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = None

    posted_at: Optional[datetime] = None

    embedding: Optional[list[float]] = None
    raw: dict = {}