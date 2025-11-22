from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class FileEmbedding(Base):
    __tablename__ = "file_embeddings"

    fileId = Column("file_id", UUID(as_uuid=True), primary_key=True)

    # Relationships
    # kind relationship defined in FileEmbeddingKind model
    # embedding relationship defined in Unsupported model
    # embeddingImg relationship defined in Unsupported model
    # file relationship defined in File model

