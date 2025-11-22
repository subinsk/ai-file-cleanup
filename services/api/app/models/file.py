from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class File(Base):
    __tablename__ = "files"

    id = Column("id", UUID(as_uuid=True), primary_key=True)
    uploadId = Column("upload_id", UUID(as_uuid=True))
    fileName = Column("file_name", String, nullable=False)
    mimeType = Column("mime_type", String, nullable=False)
    sizeBytes = Column("size_bytes", BigInteger, nullable=False)
    sha256 = Column("sha256", String, nullable=False)
    phash = Column("phash", String)
    textExcerpt = Column("text_excerpt", String)
    createdAt = Column("created_at", DateTime(timezone=True), nullable=False)

    # Relationships
    # upload relationship defined in Upload model
    # embedding relationship defined in FileEmbedding model
    keptInGroup = relationship("DedupeGroup", back_populates="dedupeGroup")

