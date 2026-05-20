import pytest


class _FakeCursor:
    def __init__(self, rows):
        self._rows = rows

    def execute(self, *_):
        pass

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return self._rows

    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass


class _FakeConn:
    def __init__(self, rows):
        self._rows = rows

    def cursor(self):
        return _FakeCursor(self._rows)

    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass


@pytest.fixture
def fake_db(monkeypatch):
    """Patch a `get_conn` target so DB calls return canned rows."""
    def _patch(target, rows):
        monkeypatch.setattr(target, lambda: _FakeConn(rows))
    return _patch
