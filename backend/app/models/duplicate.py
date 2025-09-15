"""
Duplicate model for storing duplicate file relationships
"""

from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Duplicate(Base):
    """Duplicate model for storing duplicate file relationships"""
    
    __tablename__ = "duplicates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=False, index=True)
    duplicate_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=False, index=True)
    duplicate_group_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # Groups related duplicates
    similarity_score = Column(Float, nullable=False)  # 0.0 to 1.0
    detection_method = Column(String(50), nullable=False)  # "hash", "perceptual", "semantic", "content"
    is_primary = Column(String(10), default="false")  # "true" for the original file in group
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    file = relationship("File", foreign_keys=[file_id])
    duplicate_file = relationship("File", foreign_keys=[duplicate_file_id])
    
    def __repr__(self):
        return f"<Duplicate(id={self.id}, file_id={self.file_id}, duplicate_file_id={self.duplicate_file_id}, similarity={self.similarity_score})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": str(self.id),
            "file_id": str(self.file_id),
            "duplicate_file_id": str(self.duplicate_file_id),
            "duplicate_group_id": str(self.duplicate_group_id),
            "similarity_score": self.similarity_score,
            "detection_method": self.detection_method,
            "is_primary": self.is_primary,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
