import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text

DB_PATH = os.environ.get("DB_PATH", "/data/euromillones.db")
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def _existing_columns(conn, table: str) -> set[str]:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {r[1] for r in rows}


def _migrate(conn) -> None:
    """Migraciones ligeras idempotentes para SQLite."""
    # Ticket
    cols = _existing_columns(conn, "ticket")
    if cols and "reinvertido" not in cols:
        conn.execute(text("ALTER TABLE ticket ADD COLUMN reinvertido FLOAT DEFAULT 0"))
    # Gasto
    cols = _existing_columns(conn, "gasto")
    if cols:
        if "reinvertido" not in cols:
            conn.execute(text("ALTER TABLE gasto ADD COLUMN reinvertido FLOAT DEFAULT 0"))
        if "origen_tipo" not in cols:
            conn.execute(text("ALTER TABLE gasto ADD COLUMN origen_tipo VARCHAR"))
        if "origen_id" not in cols:
            conn.execute(text("ALTER TABLE gasto ADD COLUMN origen_id INTEGER"))


def init_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    SQLModel.metadata.create_all(engine)
    with engine.begin() as conn:
        _migrate(conn)


def get_session():
    with Session(engine) as session:
        yield session
