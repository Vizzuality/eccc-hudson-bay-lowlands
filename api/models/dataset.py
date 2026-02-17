"""Dataset SQLAlchemy model."""

from sqlalchemy import JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Dataset(Base):
    """Dataset model grouping related layers."""

    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)

    layers: Mapped[list["Layer"]] = relationship(  # noqa: F821
        "Layer", back_populates="dataset", cascade="all, delete-orphan"
    )
