"""Orchestrate fetch -> normalize -> embed -> load for ingestion."""
import logging

from .data_api import WeLoveDevsClient
from .load import get_conn, upsert_offers
from .normalize import normalize_offer

logger = logging.getLogger(__name__)


def _embed_offers(offers):
    """Compute MiniLM embeddings for each offer (in-place, batched)."""
    if not offers:
        return
    from ..ai.backbone import encode

    texts = [f"{o.title}\n{o.description}" for o in offers]
    vectors = encode(texts)
    for offer, vec in zip(offers, vectors):
        offer.embedding = vec.tolist()


def _start_run():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO ingestion_runs (source, status) "
                "VALUES (%s, 'running') RETURNING id",
                ("welovedevs",),
            )
            run_id = cur.fetchone()[0]
    return run_id


def _finish_run(run_id, *, status, stats=None, error=None):
    stats = stats or {}
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ingestion_runs
                SET finished_at = NOW(),
                    status = %s,
                    total_fetched = %s,
                    total_normalized = %s,
                    inserted = %s,
                    updated = %s,
                    errors = %s,
                    error_message = %s
                WHERE id = %s
                """,
                (
                    status,
                    stats.get("total_fetched", 0),
                    stats.get("total_normalized", 0),
                    stats.get("inserted", 0),
                    stats.get("updated", 0),
                    stats.get("errors", 0),
                    error,
                    run_id,
                ),
            )


def run_ingestion():
    logger.info("Starting ingestion...")
    run_id = _start_run()

    try:
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

        _embed_offers(normalized)
        logger.info("Embedded %d offers", len(normalized))

        result = upsert_offers(normalized)
        logger.info("DB: inserted=%d, updated=%d", result["inserted"], result["updated"])

        stats = {
            "total_fetched": len(raw_offers),
            "total_normalized": len(normalized),
            "inserted": result["inserted"],
            "updated": result["updated"],
            "errors": errors,
        }
        _finish_run(run_id, status="success", stats=stats)
        return stats
    except Exception as e:
        logger.exception("Ingestion failed")
        _finish_run(run_id, status="failed", error=str(e))
        raise


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    run_ingestion()
