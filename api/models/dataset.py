"""Dataset SQLAlchemy model."""

from sqlalchemy import JSON, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Dataset(Base):
    """Dataset model grouping related layers."""

    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id"), nullable=False)

    category: Mapped["Category"] = relationship(  # noqa: F821
        "Category", back_populates="datasets"
    )
    layers: Mapped[list["Layer"]] = relationship(  # noqa: F821
        "Layer", back_populates="dataset", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_datasets_category_id", "category_id"),)
