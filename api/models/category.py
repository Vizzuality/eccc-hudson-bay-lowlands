"""Category SQLAlchemy model."""

from sqlalchemy import JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Category(Base):
    """Category model grouping related datasets."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)

    datasets: Mapped[list["Dataset"]] = relationship(  # noqa: F821
        "Dataset", back_populates="category", cascade="all, delete-orphan"
    )
