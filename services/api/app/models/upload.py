"""Upload model"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_files = Column("total_files", Integer, default=0, nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="uploads")
    files = relationship("File", back_populates="upload", cascade="all, delete-orphan")
    dedupe_groups = relationship("DedupeGroup", back_populates="upload", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('uploads_user_id_created_at_idx', 'user_id', 'created_at'),
    )
