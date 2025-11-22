"""DedupeGroup model"""
from sqlalchemy import Column, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models import Base


class DedupeGroup(Base):
    __tablename__ = "dedupe_groups"

    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column("upload_id", UUID(as_uuid=True), ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    group_index = Column("group_index", Integer, nullable=False)
    kept_file_id = Column("kept_file_id", UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    upload = relationship("Upload", back_populates="dedupe_groups")
    kept_file = relationship("File", back_populates="kept_in_groups", foreign_keys=[kept_file_id])

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('upload_id', 'group_index', name='dedupe_groups_upload_id_group_index_key'),
        Index('dedupe_groups_upload_id_idx', 'upload_id'),
    )
