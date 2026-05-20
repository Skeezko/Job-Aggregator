"""Top-K recommended offers for a user."""
from .backbone import encode
from ..etl.load import get_conn


def recommend_for_user(skills, desired_role=None, top_k=10):
    query = f"{desired_role or ''} skills: {', '.join(skills)}"
    user_vec = encode([query])[0]
    vec_str = str(user_vec.tolist())

    sql = """
        SELECT id, title, company, location_city,
               1 - (embedding <=> %s::vector) AS score
        FROM offers
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %s::vector
        LIMIT %s;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (vec_str, vec_str, top_k))
            rows = cur.fetchall()

    return [
        {
            "id": str(row[0]),
            "title": row[1],
            "company": row[2],
            "location": row[3],
            "score": float(row[4]),
        }
        for row in rows
    ]