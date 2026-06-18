"""
GA Parameter Explorer — Async Database Engine
SQLAlchemy 2.0 AsyncEngine backed by aiosqlite.
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.core.config import settings

# Build the connection URL.  SQLModel/SQLAlchemy use "sqlite+aiosqlite://"
_db_url = f"sqlite+aiosqlite:///{settings.DB_PATH}"

engine = create_async_engine(
    _db_url,
    echo=False,
    connect_args={
        "check_same_thread": False,
        # Enable WAL mode for better concurrent read performance
        "timeout": 30,
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def init_db() -> None:
    """Create all tables if they don't exist yet.  Called at app startup."""
    # Import models here so SQLModel metadata is populated before create_all
    import app.models.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a DB session and commits/rolls-back on exit."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
