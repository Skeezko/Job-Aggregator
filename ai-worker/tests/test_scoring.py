import numpy as np

from src.ai import scoring
from src.ai.scoring import score_user_offer


def _fake_encode(vec):
    return lambda texts: np.array([vec], dtype=np.float32)


def test_offer_not_found(fake_db, monkeypatch):
    fake_db("src.ai.scoring.get_conn", rows=[])
    monkeypatch.setattr(scoring, "encode", _fake_encode([1.0, 0.0, 0.0]))

    result = score_user_offer("uuid", ["python"])
    assert result == {"offer_id": "uuid", "score": 0, "matched_skills": []}


def test_offer_without_embedding(fake_db, monkeypatch):
    fake_db("src.ai.scoring.get_conn", rows=[(None, "Some title")])
    monkeypatch.setattr(scoring, "encode", _fake_encode([1.0, 0.0, 0.0]))

    result = score_user_offer("uuid", ["python"])
    assert result["score"] == 0


def test_semantic_score_only_no_skill_in_title(fake_db, monkeypatch):
    offer_vec = [1.0, 0.0, 0.0]
    fake_db("src.ai.scoring.get_conn", rows=[(offer_vec, "Backend engineer")])
    monkeypatch.setattr(scoring, "encode", _fake_encode([1.0, 0.0, 0.0]))

    result = score_user_offer("uuid", ["rust"])
    assert result["score"] == 100
    assert result["matched_skills"] == []


def test_semantic_plus_skill_bonus(fake_db, monkeypatch):
    offer_vec = [0.5, 0.5, 0.0]
    user_vec = [1.0, 0.0, 0.0]
    fake_db("src.ai.scoring.get_conn", rows=[(offer_vec, "Senior Python engineer")])
    monkeypatch.setattr(scoring, "encode", _fake_encode(user_vec))

    result = score_user_offer("uuid", ["python"])
    # semantic = int(0.5 * 100) = 50, bonus = 5 (one match)
    assert result["score"] == 55
    assert result["matched_skills"] == ["python"]


def test_skill_bonus_caps_at_20(fake_db, monkeypatch):
    offer_vec = [0.0, 0.0, 1.0]
    user_vec = [1.0, 0.0, 0.0]
    title = "python rust go java sql kafka engineer"
    fake_db("src.ai.scoring.get_conn", rows=[(offer_vec, title)])
    monkeypatch.setattr(scoring, "encode", _fake_encode(user_vec))

    result = score_user_offer("uuid", ["python", "rust", "go", "java", "sql", "kafka"])
    # semantic = 0, bonus = min(20, 6 * 5) = 20
    assert result["score"] == 20
    assert len(result["matched_skills"]) == 6


def test_total_score_caps_at_100(fake_db, monkeypatch):
    offer_vec = [1.0, 0.0, 0.0]
    fake_db("src.ai.scoring.get_conn", rows=[(offer_vec, "Python rust engineer")])
    monkeypatch.setattr(scoring, "encode", _fake_encode([1.0, 0.0, 0.0]))

    result = score_user_offer("uuid", ["python", "rust"])
    # semantic = 100, bonus = 10, capped at 100
    assert result["score"] == 100


def test_negative_similarity_clamped_to_zero(fake_db, monkeypatch):
    offer_vec = [-1.0, 0.0, 0.0]
    fake_db("src.ai.scoring.get_conn", rows=[(offer_vec, "Backend engineer")])
    monkeypatch.setattr(scoring, "encode", _fake_encode([1.0, 0.0, 0.0]))

    result = score_user_offer("uuid", ["rust"])
    assert result["score"] == 0
