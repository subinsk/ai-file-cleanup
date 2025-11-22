"""FileEmbedding model with pgvector support"""
from sqlalchemy import Column, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.models import Base


class FileEmbedding(Base):
    __tablename__ = "file_embeddings"

    file_id = Column("file_id", UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), primary_key=True)
    kind = Column("kind", SQLEnum("image", "text", name="file_embedding_kind"), nullable=False)
    embedding = Column("embedding", Vector(768), nullable=True)  # Text embedding (DistilBERT)
    embedding_img = Column("embedding_img", Vector(512), nullable=True)  # Image embedding (CLIP)

    # Relationships
    file = relationship("File", back_populates="embedding")

    # Indexes (HNSW indexes are created via migrations)
    __table_args__ = (
        Index('file_embeddings_kind_idx', 'kind'),
    )
