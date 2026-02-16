"""Dataset SQLAlchemy model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from models.layer import Layer


class Dataset(Base):
    """Dataset model for grouping related layers with i18n metadata."""

    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)

    layers: Mapped[list[Layer]] = relationship(back_populates="dataset", cascade="all, delete-orphan")
