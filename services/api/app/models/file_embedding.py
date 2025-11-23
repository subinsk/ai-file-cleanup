from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class FileEmbedding(Base):
    __tablename__ = "file_embeddings"

    fileId = Column("file_id", UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    kind = relationship("FileEmbeddingKind", back_populates="fileembeddings", uselist=False)
    embedding = relationship("Unsupported", back_populates="fileembeddings", uselist=False)
    embeddingImg = relationship("Unsupported", back_populates="fileembeddings", uselist=False)
    file = relationship("File", back_populates="fileembeddings", uselist=False)

