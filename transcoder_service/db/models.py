from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Text, DateTime, func, ForeignKey
from db.database import Base

class VideoMetaData(Base):
    __tablename__ = "video_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str | None] = mapped_column(String(100), nullable=True)
    key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HLS(Base):
    __tablename__ = "hls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_metadata_id: Mapped[int] = mapped_column(Integer, ForeignKey("video_metadata.id"), nullable=False)
    hls_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())