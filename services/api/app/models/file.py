"""File model"""
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models import Base


class File(Base):
    __tablename__ = "files"

    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column("upload_id", UUID(as_uuid=True), ForeignKey("uploads.id", ondelete="CASCADE"), nullable=True)
    file_name = Column("file_name", String, nullable=False)
    mime_type = Column("mime_type", String, nullable=False)
    size_bytes = Column("size_bytes", BigInteger, nullable=False)
    sha256 = Column("sha256", String, nullable=False)
    phash = Column("phash", String, nullable=True)
    text_excerpt = Column("text_excerpt", String, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    upload = relationship("Upload", back_populates="files")
    embedding = relationship("FileEmbedding", back_populates="file", uselist=False, cascade="all, delete-orphan")
    kept_in_groups = relationship("DedupeGroup", back_populates="kept_file", foreign_keys="DedupeGroup.kept_file_id")

    # Indexes
    __table_args__ = (
        Index('files_upload_id_idx', 'upload_id'),
        Index('files_sha256_idx', 'sha256'),
        Index('files_phash_idx', 'phash'),
    )
