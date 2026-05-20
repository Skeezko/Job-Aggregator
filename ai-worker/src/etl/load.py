"""Insert normalized offers into PostgreSQL."""
import os
import psycopg2
from psycopg2.extras import Json, execute_values


def get_conn():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


UPSERT_SQL = """
INSERT INTO offers (
    source, source_id, title, description, company,
    location_city, location_country, remote_policy, contract_type,
    salary_min, salary_max, salary_currency, posted_at, raw
) VALUES %s
ON CONFLICT (source, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    company = EXCLUDED.company,
    location_city = EXCLUDED.location_city,
    location_country = EXCLUDED.location_country,
    remote_policy = EXCLUDED.remote_policy,
    contract_type = EXCLUDED.contract_type,
    salary_min = EXCLUDED.salary_min,
    salary_max = EXCLUDED.salary_max,
    salary_currency = EXCLUDED.salary_currency,
    posted_at = EXCLUDED.posted_at,
    raw = EXCLUDED.raw,
    updated_at = NOW()
RETURNING (xmax = 0) AS inserted;
"""


def upsert_offers(offers):
    """Upsert NormalizedOffer list. Returns {'inserted': N, 'updated': M}."""
    if not offers:
        return {"inserted": 0, "updated": 0}

    rows = [
        (
            o.source,
            o.source_id,
            o.title,
            o.description,
            o.company,
            o.location_city,
            o.location_country,
            o.remote_policy,
            o.contract_type,
            o.salary_min,
            o.salary_max,
            o.salary_currency,
            o.posted_at,
            Json(o.raw),
        )
        for o in offers
    ]

    with get_conn() as conn:
        with conn.cursor() as cur:
            results = execute_values(cur, UPSERT_SQL, rows, fetch=True)

    # xmax = 0 means the row was freshly inserted 
    inserted = sum(1 for (is_new,) in results if is_new)
    updated = len(results) - inserted

    return {"inserted": inserted, "updated": updated}
