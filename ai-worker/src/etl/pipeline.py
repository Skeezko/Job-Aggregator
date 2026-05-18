"""Orchestrate fetch → normalize → load for ingestion."""
import logging
from .data_api import WeLoveDevsClient
from .normalize import normalize_offer
from .load import upsert_offers

logger = logging.getLogger(__name__)


def run_ingestion():
    logger.info("Starting ingestion...")

    client = WeLoveDevsClient()
    raw_offers = client.fetch_all()
    logger.info("Fetched %d raw offers", len(raw_offers))

    normalized = []
    errors = 0
    for raw in raw_offers:
        try:
            normalized.append(normalize_offer(raw))
        except Exception as e:
            logger.warning("Skipped offer (normalize error): %s", e)
            errors += 1

    logger.info("Normalized %d offers (%d errors)", len(normalized), errors)

    result = upsert_offers(normalized)
    logger.info("DB: inserted=%d, updated=%d", result["inserted"], result["updated"])

    return {
        "total_fetched": len(raw_offers),
        "total_normalized": len(normalized),
        "inserted": result["inserted"],
        "updated": result["updated"],
        "errors": errors,
    }
