from src.ai.deduplicate import find_duplicates


def test_returns_empty_when_no_matches(fake_db):
    fake_db("src.ai.deduplicate.get_conn", rows=[])
    assert find_duplicates("uuid") == []


def test_formats_rows(fake_db):
    fake_db("src.ai.deduplicate.get_conn", rows=[
        ("id-1", "Senior Python", "Acme", 0.97),
        ("id-2", "Python Engineer", "Beta", 0.94),
    ])

    result = find_duplicates("uuid")
    assert result == [
        {"id": "id-1", "title": "Senior Python", "company": "Acme", "similarity": 0.97},
        {"id": "id-2", "title": "Python Engineer", "company": "Beta", "similarity": 0.94},
    ]
