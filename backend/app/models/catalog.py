from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "scheme_categories"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)


class Scheme(Base):
    __tablename__ = "schemes"
    __table_args__ = (
        CheckConstraint("level IN ('central', 'state')", name="valid_level"),
        CheckConstraint("(level = 'central' AND state IS NULL) OR (level = 'state' AND state IS NOT NULL)", name="valid_scope"),
    )
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    category_id: Mapped[str] = mapped_column(ForeignKey(Category.id), index=True)
    level: Mapped[str] = mapped_column(String(10))
    state: Mapped[str | None] = mapped_column(String(80), index=True)
    department: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    benefits: Mapped[str] = mapped_column(Text)
    application_process: Mapped[str] = mapped_column(Text)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    demo: Mapped[bool] = mapped_column(Boolean, default=True)
    category: Mapped[Category] = relationship(lazy="joined")
    rules: Mapped[list["Rule"]] = relationship(cascade="all, delete-orphan", lazy="selectin", order_by="Rule.id")
    documents: Mapped[list["Document"]] = relationship(cascade="all, delete-orphan", lazy="selectin", order_by="Document.id")
    sources: Mapped[list["Source"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class Child:
    id: Mapped[int] = mapped_column(primary_key=True)
    scheme_id: Mapped[str] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), index=True)


class Rule(Child, Base):
    __tablename__ = "eligibility_rules"
    field: Mapped[str] = mapped_column(String(50))
    operator: Mapped[str] = mapped_column(String(10))
    value: Mapped[object] = mapped_column(JSON)


class Document(Child, Base):
    __tablename__ = "scheme_documents"
    name: Mapped[str] = mapped_column(String(200))


class Source(Child, Base):
    __tablename__ = "scheme_sources"
    url: Mapped[str] = mapped_column(String(500))
    application_url: Mapped[str | None] = mapped_column(String(500))
    verification_status: Mapped[str] = mapped_column(String(60))
    last_verified: Mapped[date | None] = mapped_column(Date)
