"""Transform a raw offer into a NormalizedOffer."""
import re
from datetime import datetime
from typing import Optional
from .models import NormalizedOffer


def parse_salary(raw):
    if not raw or not isinstance(raw, str):
        return None, None, None

    match = re.search(
        r"(\d+)\s*(?:[-à]\s*(\d+)\s*)?(k)?\s*(€|EUR|\$|USD|£|GBP)?",
        raw,
        re.IGNORECASE,
    )
    if not match:
        return None, None, None

    min_str, max_str, k_unit, currency_raw = match.groups()

    salary_min = int(min_str) if min_str else None
    salary_max = int(max_str) if max_str else None

    if k_unit:
        if salary_min is not None:
            salary_min *= 1000
        if salary_max is not None:
            salary_max *= 1000

    currency_map = {
        "€": "EUR", "EUR": "EUR",
        "$": "USD", "USD": "USD",
        "£": "GBP", "GBP": "GBP",
    }
    currency = currency_map.get(currency_raw) if currency_raw else None

    # A salary under 1000 without 'k' is almost certainly a parse error
    if salary_min is not None and salary_min < 1000:
        return None, None, None

    return salary_min, salary_max, currency


CONTRACT_MAP = {
    "stage": "internship",
    "internship": "internship",
    "alternance": "apprenticeship",
    "apprenticeship": "apprenticeship",
    "cdi": "full_time",
    "fulltime": "full_time",
    "full_time": "full_time",
    "freelance": "freelance",
}


def normalize_contract(raw):
    if not raw:
        return "unknown"
    key = raw.lower().strip().replace("-", "").replace(" ", "")
    return CONTRACT_MAP.get(key, "unknown")


def parse_location(raw):
    if not raw or not isinstance(raw, str):
        return None, None, "unknown"

    lower = raw.lower()
    if "remote" in lower or "télétravail" in lower:
        policy = "remote"
    elif "hybrid" in lower or "hybride" in lower:
        policy = "hybrid"
    else:
        policy = "onsite"

    cleaned = re.sub(
        r"(remote|hybrid|hybride|télétravail|full)",
        "",
        raw,
        flags=re.IGNORECASE,
    )
    cleaned = cleaned.replace("-", ",").strip(" ,")

    parts = [p.strip() for p in cleaned.split(",") if p.strip()]
    city = parts[0] if parts else None
    country = parts[1] if len(parts) > 1 else None

    return city, country, policy


def parse_date(raw):
    if not raw:
        return None
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def normalize_offer(raw):

    company = raw.get("company")
    if isinstance(company, dict):
        company = company.get("name")

    salary_min, salary_max, currency = parse_salary(raw.get("salary"))
    city, country, remote = parse_location(raw.get("location"))

    return NormalizedOffer(
        source="welovedevs",
        source_id=str(raw["id"]),
        title=(raw.get("title") or "").strip(),
        description=(raw.get("description") or "").strip(),
        company=company,
        location_city=city,
        location_country=country,
        remote_policy=remote,
        contract_type=normalize_contract(raw.get("contractType")),
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency=currency,
        posted_at=parse_date(raw.get("publishedAt") or raw.get("createdAt")),
        raw=raw,
    )
