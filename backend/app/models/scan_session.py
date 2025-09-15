"""
Scan session model for tracking scanning operations
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class ScanSession(Base):
    """Scan session model for tracking scanning operations"""
    
    __tablename__ = "scan_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    directory_path = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # "pending", "running", "completed", "failed"
    files_processed = Column(Integer, default=0)
    files_total = Column(Integer, default=0)
    duplicates_found = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    progress_percentage = Column(Float, default=0.0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<ScanSession(id={self.id}, directory='{self.directory_path}', status='{self.status}')>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": str(self.id),
            "directory_path": self.directory_path,
            "status": self.status,
            "files_processed": self.files_processed,
            "files_total": self.files_total,
            "duplicates_found": self.duplicates_found,
            "errors_count": self.errors_count,
            "progress_percentage": self.progress_percentage,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message
        }
    
    def update_progress(self, files_processed: int, files_total: int, duplicates_found: int = None):
        """Update scan progress"""
        self.files_processed = files_processed
        self.files_total = files_total
        if duplicates_found is not None:
            self.duplicates_found = duplicates_found
        
        if files_total > 0:
            self.progress_percentage = (files_processed / files_total) * 100
    
    def mark_completed(self):
        """Mark scan as completed"""
        self.status = "completed"
        self.completed_at = func.now()
        self.progress_percentage = 100.0
    
    def mark_failed(self, error_message: str):
        """Mark scan as failed"""
        self.status = "failed"
        self.completed_at = func.now()
        self.error_message = error_message
