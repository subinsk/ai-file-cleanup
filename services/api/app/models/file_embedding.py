from app.models.base import Base
from datetime import datetime
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
import uuid

class FileEmbeddingKind(str, enum.Enum):
    IMAGE = "image"
    TEXT = "text"


class FileEmbedding(Base):
    __tablename__ = "file_embeddings"

    fileId = Column("file_id", UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), primary_key=True)
    kind = Column("kind", SQLEnum(FileEmbeddingKind, name="file_embedding_kind"), nullable=False)
    embedding = Column("embedding", Vector(768))
    embeddingImg = Column("embedding_img", Vector(512))

    # Relationships
    file = relationship("File", back_populates="embedding", uselist=False)

