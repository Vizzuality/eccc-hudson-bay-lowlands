"""Layer SQLAlchemy model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from models.dataset import Dataset


class Layer(Base):
    """Layer model for storing geospatial layer metadata with i18n support."""

    __tablename__ = "layers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    units: Mapped[str | None] = mapped_column(String, nullable=True)
    legend: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    dataset_id: Mapped[int | None] = mapped_column(ForeignKey("datasets.id"), nullable=True, index=True)

    dataset: Mapped[Dataset | None] = relationship(back_populates="layers")
