"""
File model for storing file metadata
"""

from sqlalchemy import Column, String, BigInteger, DateTime, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class File(Base):
    """File model for storing file metadata and classification results"""
    
    __tablename__ = "files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    path = Column(Text, unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    size = Column(BigInteger, nullable=True)
    file_type = Column(String(50), nullable=True)  # Extension-based type
    category = Column(String(50), nullable=True)   # AI-classified category
    hash_md5 = Column(String(32), nullable=True, index=True)
    hash_sha256 = Column(String(64), nullable=True, index=True)
    perceptual_hash = Column(String(16), nullable=True, index=True)  # For image similarity
    content_hash = Column(String(64), nullable=True, index=True)     # For content similarity
    confidence_score = Column(Float, nullable=True)  # ML classification confidence
    is_duplicate = Column(String(10), default="false")  # "true", "false", "unknown"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    modified_at = Column(DateTime(timezone=True), onupdate=func.now())
    scanned_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<File(id={self.id}, name='{self.name}', path='{self.path}')>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": str(self.id),
            "path": self.path,
            "name": self.name,
            "size": self.size,
            "file_type": self.file_type,
            "category": self.category,
            "hash_md5": self.hash_md5,
            "hash_sha256": self.hash_sha256,
            "perceptual_hash": self.perceptual_hash,
            "content_hash": self.content_hash,
            "confidence_score": self.confidence_score,
            "is_duplicate": self.is_duplicate,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "modified_at": self.modified_at.isoformat() if self.modified_at else None,
            "scanned_at": self.scanned_at.isoformat() if self.scanned_at else None
        }
