import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./schemely.db")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_db():
    with Session(engine) as session:
        yield session
