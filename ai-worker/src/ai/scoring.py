"""User/offer relevance score (0-100)."""
import numpy as np
from .backbone import encode
from ..etl.load import get_conn


def score_user_offer(offer_id, skills, desired_role=None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT embedding, title FROM offers WHERE id = %s",
                (offer_id,),
            )
            row = cur.fetchone()

    if not row or row[0] is None:
        return {"offer_id": str(offer_id), "score": 0, "matched_skills": []}

    offer_vec, title = row
    offer_vec = np.array(offer_vec, dtype=np.float32)

    query = f"{desired_role or ''} skills: {', '.join(skills)}"
    user_vec = encode([query])[0]

    # Vectors are L2-normalized upstream, so dot product == cosine similarity.
    similarity = float(np.dot(user_vec, offer_vec))
    semantic_score = max(0, int(similarity * 100))

    title_lower = title.lower()
    matched = [s for s in skills if s.lower() in title_lower]
    bonus = min(20, len(matched) * 5)

    total = min(100, semantic_score + bonus)

    return {
        "offer_id": str(offer_id),
        "score": total,
        "matched_skills": matched,
    }