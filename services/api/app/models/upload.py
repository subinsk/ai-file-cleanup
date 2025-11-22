from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class Upload(Base):
    __tablename__ = "uploads"

    id = Column("id", UUID(as_uuid=True), primary_key=True)
    userId = Column("user_id", UUID(as_uuid=True))
    totalFiles = Column("total_files", Integer, nullable=False, default=0)
    createdAt = Column("created_at", DateTime(timezone=True), nullable=False)

    # Relationships
    # user relationship defined in User model
    files = relationship("File", back_populates="file")
    dedupeGroups = relationship("DedupeGroup", back_populates="dedupeGroup")

