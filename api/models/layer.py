"""Layer SQLAlchemy model."""

from sqlalchemy import JSON, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Layer(Base):
    """Layer model for geospatial layer metadata."""

    __tablename__ = "layers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    format_: Mapped[str] = mapped_column("format", String, nullable=False)
    type_: Mapped[str | None] = mapped_column("type", String, nullable=True)
    path: Mapped[str] = mapped_column(String, nullable=False)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    categories: Mapped[list | None] = mapped_column(JSON, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    dataset_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("datasets.id"), nullable=True)

    dataset: Mapped["Dataset"] = relationship(  # noqa: F821
        "Dataset", back_populates="layers"
    )

    __table_args__ = (Index("ix_layers_dataset_id", "dataset_id"),)
