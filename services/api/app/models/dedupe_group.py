from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class DedupeGroup(Base):
    __tablename__ = "dedupe_groups"

    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploadId = Column("upload_id", UUID(as_uuid=True), ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    groupIndex = Column("group_index", Integer, nullable=False)
    keptFileId = Column("kept_file_id", UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"))

    # Relationships
    upload = relationship("Upload", back_populates="dedupeGroups", uselist=False)
    keptFile = relationship("File", back_populates="keptInGroup", uselist=False, foreign_keys=[keptFileId])

