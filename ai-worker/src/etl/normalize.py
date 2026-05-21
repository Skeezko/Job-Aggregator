"""Transform a raw WeLoveDevs offer into a NormalizedOffer."""
from datetime import datetime
from .models import NormalizedOffer


CONTRACT_MAP = {
    "permanent": "full_time",
    "cdi": "full_time",
    "fulltime": "full_time",
    "full_time": "full_time",
    "internship": "internship",
    "stage": "internship",
    "apprenticeship": "apprenticeship",
    "alternance": "apprenticeship",
    "freelance": "freelance",
}


def normalize_contract(raw):
    """Pick the first known contract type from a WLD `contractTypes` list."""
    if not isinstance(raw, list) or not raw:
        return "unknown"
    for item in raw:
        if not isinstance(item, str):
            continue
        mapped = CONTRACT_MAP.get(item.strip().lower())
        if mapped:
            return mapped
    return "unknown"


REMOTE_MAP = {
    "remote": "remote",
    "full": "remote",
    "fulltime": "remote",
    "hybrid": "hybrid",
    "partial": "hybrid",
    "onsite": "onsite",
    "none": "onsite",
}


def normalize_remote(raw):
    """Read WLD `details.remotePolicy.frequency` into our enum."""
    if not isinstance(raw, dict):
        return "unknown"
    freq = raw.get("frequency")
    if not isinstance(freq, str):
        return "unknown"
    return REMOTE_MAP.get(freq.strip().lower(), "unknown")


CURRENCY_SYMBOL_MAP = {
    "€": "EUR",
    "$": "USD",
    "£": "GBP",
}


def _normalize_currency(raw):
    if not isinstance(raw, str):
        return None
    cleaned = raw.strip()
    if cleaned in CURRENCY_SYMBOL_MAP:
        return CURRENCY_SYMBOL_MAP[cleaned]
    return cleaned.upper() if cleaned else None


def parse_salary(raw):
    """Read WLD `details.salary` ({currency, min, max, recurrence})."""
    if not isinstance(raw, dict):
        return None, None, None

    raw_min = raw.get("min")
    raw_max = raw.get("max")

    if not raw_min and not raw_max:
        return None, None, None

    multiplier = 1000 if raw.get("recurrence") == "year" else 1
    salary_min = int(raw_min) * multiplier if raw_min else None
    salary_max = int(raw_max) * multiplier if raw_max else None
    currency = _normalize_currency(raw.get("currency"))

    return salary_min, salary_max, currency


def parse_location(raw):
    """Read WLD `formattedPlaces` (list[str]) into (city, country)."""
    if not isinstance(raw, list) or not raw:
        return None, None
    parts = [p.strip() for p in raw if isinstance(p, str) and p.strip()]
    if not parts:
        return None, None
    if len(parts) == 1:
        return None, parts[0]
    return parts[0], parts[-1]


def parse_date(raw):
    """Accept WLD microsecond timestamps, ISO strings, or datetime."""
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, (int, float)):
        seconds = raw / 1_000_000
        try:
            return datetime.fromtimestamp(seconds)
        except (OverflowError, OSError, ValueError):
            return None
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _company_name(raw):
    company = raw.get("smallCompany")
    if isinstance(company, dict):
        return company.get("companyName")
    return None


def normalize_offer(raw):
    title = (raw.get("title") or "").strip()
    description = (raw.get("descriptionPreview") or "").strip()
    if not title or not description:
        raise ValueError("offer must have a non-empty title and description")

    details = raw.get("details") or {}
    salary_min, salary_max, currency = parse_salary(details.get("salary"))
    city, country = parse_location(raw.get("formattedPlaces"))

    return NormalizedOffer(
        source="welovedevs",
        source_id=str(raw["id"]),
        title=title,
        description=description,
        company=_company_name(raw),
        location_city=city,
        location_country=country,
        remote_policy=normalize_remote(details.get("remotePolicy")),
        contract_type=normalize_contract(raw.get("contractTypes")),
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency=currency,
        posted_at=parse_date(raw.get("publishDate")),
        raw=raw,
    )
