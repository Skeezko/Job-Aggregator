import numpy as np

from src.ai import recommend
from src.ai.recommend import recommend_for_user


def _fake_encode(texts):
    return np.array([[1.0, 0.0, 0.0]], dtype=np.float32)


def test_returns_empty_when_no_offers(fake_db, monkeypatch):
    fake_db("src.ai.recommend.get_conn", rows=[])
    monkeypatch.setattr(recommend, "encode", _fake_encode)

    assert recommend_for_user(["python"]) == []


def test_formats_rows(fake_db, monkeypatch):
    fake_db("src.ai.recommend.get_conn", rows=[
        ("id-1", "Python dev", "Acme", "Paris", 0.91),
        ("id-2", "Rust dev", "Beta", "Lyon", 0.85),
    ])
    monkeypatch.setattr(recommend, "encode", _fake_encode)

    result = recommend_for_user(["python", "rust"], desired_role="backend", top_k=2)
    assert result == [
        {"id": "id-1", "title": "Python dev", "company": "Acme", "location": "Paris", "score": 0.91},
        {"id": "id-2", "title": "Rust dev", "company": "Beta", "location": "Lyon", "score": 0.85},
    ]
