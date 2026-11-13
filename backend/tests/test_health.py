from backend.app.main import health_check
from backend.app.database import init_db
from .conftest import run_coro


def test_health_check_endpoint():
    init_db()
    data = run_coro(health_check())
    assert data.status == "ok"
    assert data.version == "2.4.0-enterprise"
    assert data.database == "sqlite3"
    assert data.llm_model in ("gemini-3-flash-preview", "gemini-3.8-flash")
