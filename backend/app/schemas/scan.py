"""
Pydantic schemas for scan operations
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ScanRequest(BaseModel):
    """Request schema for starting a scan"""
    directory_path: str = Field(..., description="Path to directory to scan")
    include_subdirectories: bool = Field(True, description="Include subdirectories in scan")
    file_types: Optional[list] = Field(None, description="Specific file types to scan")
    max_file_size: Optional[int] = Field(None, description="Maximum file size to process")


class ScanResponse(BaseModel):
    """Response schema for scan start"""
    session_id: str = Field(..., description="Unique session identifier")
    status: str = Field(..., description="Scan status")
    message: str = Field(..., description="Response message")


class ScanStatus(BaseModel):
    """Schema for scan status and progress"""
    session_id: str = Field(..., description="Session identifier")
    status: str = Field(..., description="Current status: pending, running, completed, failed")
    progress_percentage: float = Field(0.0, description="Progress percentage (0-100)")
    files_processed: int = Field(0, description="Number of files processed")
    files_total: int = Field(0, description="Total number of files to process")
    duplicates_found: int = Field(0, description="Number of duplicates found")
    errors_count: int = Field(0, description="Number of errors encountered")
    started_at: Optional[datetime] = Field(None, description="Scan start time")
    completed_at: Optional[datetime] = Field(None, description="Scan completion time")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    
    class Config:
        from_attributes = True
