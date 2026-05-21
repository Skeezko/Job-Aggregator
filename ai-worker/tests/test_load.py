from src.etl.load import _to_vector


def test_to_vector_none():
    assert _to_vector(None) is None


def test_to_vector_list():
    assert _to_vector([0.1, 0.2, 0.3]) == "[0.1,0.2,0.3]"


def test_to_vector_handles_ints():
    assert _to_vector([1, 2, 3]) == "[1.0,2.0,3.0]"


def test_to_vector_empty():
    assert _to_vector([]) == "[]"
