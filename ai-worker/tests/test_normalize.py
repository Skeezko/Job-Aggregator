from datetime import datetime

import pytest

from src.etl.normalize import (
    normalize_contract,
    normalize_remote,
    parse_salary,
    parse_location,
    parse_date,
    normalize_offer,
)


@pytest.mark.parametrize("raw, expected", [
    (["permanent"], "full_time"),
    (["CDI"], "full_time"),
    (["internship"], "internship"),
    (["stage"], "internship"),
    (["apprenticeship"], "apprenticeship"),
    (["alternance"], "apprenticeship"),
    (["freelance"], "freelance"),
    (["foo"], "unknown"),
    ([], "unknown"),
    (None, "unknown"),
    ("permanent", "unknown"),
])
def test_normalize_contract(raw, expected):
    assert normalize_contract(raw) == expected


@pytest.mark.parametrize("raw, expected", [
    ({"frequency": "remote"}, "remote"),
    ({"frequency": "full"}, "remote"),
    ({"frequency": "hybrid"}, "hybrid"),
    ({"frequency": "onsite"}, "onsite"),
    ({"frequency": "none"}, "onsite"),
    ({"frequency": "whatever"}, "unknown"),
    ({}, "unknown"),
    (None, "unknown"),
])
def test_normalize_remote(raw, expected):
    assert normalize_remote(raw) == expected


def test_parse_salary_annual_euro():
    s = {"currency": "€", "min": 55, "max": 60, "recurrence": "year"}
    assert parse_salary(s) == (55000, 60000, "EUR")


def test_parse_salary_only_min():
    s = {"currency": "$", "min": 80, "recurrence": "year"}
    assert parse_salary(s) == (80000, None, "USD")


def test_parse_salary_unknown_currency_kept_as_is():
    s = {"currency": "CHF", "min": 100, "max": 120, "recurrence": "year"}
    assert parse_salary(s) == (100000, 120000, "CHF")


@pytest.mark.parametrize("raw", [None, {}, {"min": None, "max": None}, {"min": 0, "max": 0}])
def test_parse_salary_empty(raw):
    assert parse_salary(raw) == (None, None, None)


@pytest.mark.parametrize("raw, expected", [
    (["France"], (None, "France")),
    (["Paris", "France"], ("Paris", "France")),
    (["Paris", "Île-de-France", "France"], ("Paris", "France")),
    ([], (None, None)),
    (None, (None, None)),
])
def test_parse_location(raw, expected):
    assert parse_location(raw) == expected


def test_parse_date_microseconds():
    # 2024-01-01 00:00:00 UTC expressed in microseconds (WLD timestamp format)
    micros = 1704067200 * 1_000_000
    assert parse_date(micros) == datetime.fromtimestamp(1704067200)


def test_parse_date_iso_string():
    assert parse_date("2024-01-01T00:00:00Z").year == 2024


def test_parse_date_passthrough():
    d = datetime(2024, 1, 1)
    assert parse_date(d) == d


@pytest.mark.parametrize("raw", [None, "", "not a date"])
def test_parse_date_invalid(raw):
    assert parse_date(raw) is None


def _raw_offer(**overrides):
    base = {
        "id": "abc123",
        "title": "Backend engineer",
        "descriptionPreview": "Build cool stuff in Rust.",
        "smallCompany": {"companyName": "Acme"},
        "formattedPlaces": ["Paris", "France"],
        "contractTypes": ["permanent"],
        "publishDate": "2024-06-01T00:00:00Z",
        "details": {
            "salary": {"currency": "€", "min": 50, "max": 70, "recurrence": "year"},
            "remotePolicy": {"frequency": "hybrid"},
        },
    }
    base.update(overrides)
    return base


def test_normalize_offer_full_payload():
    offer = normalize_offer(_raw_offer())
    assert offer.source == "welovedevs"
    assert offer.source_id == "abc123"
    assert offer.title == "Backend engineer"
    assert offer.description == "Build cool stuff in Rust."
    assert offer.company == "Acme"
    assert offer.location_city == "Paris"
    assert offer.location_country == "France"
    assert offer.remote_policy == "hybrid"
    assert offer.contract_type == "full_time"
    assert offer.salary_min == 50000
    assert offer.salary_max == 70000
    assert offer.salary_currency == "EUR"
    assert offer.posted_at is not None


def test_normalize_offer_minimal_payload():
    raw = {"id": "x", "title": "Dev", "descriptionPreview": "ok"}
    offer = normalize_offer(raw)
    assert offer.source_id == "x"
    assert offer.company is None
    assert offer.location_city is None
    assert offer.location_country is None
    assert offer.remote_policy == "unknown"
    assert offer.contract_type == "unknown"
    assert offer.salary_min is None
    assert offer.posted_at is None


@pytest.mark.parametrize("overrides", [
    {"title": ""},
    {"title": "   "},
    {"descriptionPreview": ""},
    {"title": "", "descriptionPreview": ""},
])
def test_normalize_offer_rejects_empty(overrides):
    with pytest.raises(ValueError):
        normalize_offer(_raw_offer(**overrides))
