"""Find similar offers (potential duplicates)."""
from ..etl.load import get_conn


def find_duplicates(offer_id, threshold=0.92):
    sql = """
        SELECT o.id, o.title, o.company,
               1 - (o.embedding <=> target.embedding) AS similarity
        FROM offers o, offers target
        WHERE target.id = %s
          AND o.id != target.id
          AND o.embedding IS NOT NULL
          AND (1 - (o.embedding <=> target.embedding)) >= %s
        ORDER BY similarity DESC
        LIMIT 10;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (offer_id, threshold))
            rows = cur.fetchall()

    return [
        {
            "id": str(row[0]),
            "title": row[1],
            "company": row[2],
            "similarity": float(row[3]),
        }
        for row in rows
    ]