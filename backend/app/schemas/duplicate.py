"""
Pydantic schemas for duplicate detection
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class FileInfo(BaseModel):
    """Basic file information"""
    id: str = Field(..., description="File ID")
    name: str = Field(..., description="File name")
    path: str = Field(..., description="File path")
    size: Optional[int] = Field(None, description="File size in bytes")
    file_type: Optional[str] = Field(None, description="File type/extension")
    category: Optional[str] = Field(None, description="AI-classified category")
    created_at: Optional[datetime] = Field(None, description="File creation time")
    modified_at: Optional[datetime] = Field(None, description="File modification time")


class DuplicateInfo(BaseModel):
    """Duplicate relationship information"""
    id: str = Field(..., description="Duplicate relationship ID")
    file: FileInfo = Field(..., description="File information")
    duplicate_file: FileInfo = Field(..., description="Duplicate file information")
    similarity_score: float = Field(..., description="Similarity score (0.0-1.0)")
    detection_method: str = Field(..., description="Detection method used")
    is_primary: bool = Field(False, description="Whether this is the primary file in the group")


class DuplicateGroup(BaseModel):
    """Group of duplicate files"""
    group_id: str = Field(..., description="Duplicate group identifier")
    files: List[FileInfo] = Field(..., description="Files in the duplicate group")
    primary_file: FileInfo = Field(..., description="Primary file in the group")
    similarity_scores: List[float] = Field(..., description="Similarity scores for each file")
    total_size: int = Field(..., description="Total size of all files in group")
    space_wasted: int = Field(..., description="Space that could be saved by removing duplicates")
    created_at: datetime = Field(..., description="When duplicates were detected")


class DuplicateResponse(BaseModel):
    """Response schema for duplicate detection"""
    duplicates: List[DuplicateGroup] = Field(..., description="List of duplicate groups")
    total_groups: int = Field(..., description="Total number of duplicate groups")
    total_files: int = Field(..., description="Total number of duplicate files")
    total_space_wasted: int = Field(..., description="Total space wasted by duplicates")
    
    class Config:
        from_attributes = True


class DuplicateStats(BaseModel):
    """Statistics about duplicates"""
    total_duplicate_groups: int = Field(0, description="Total number of duplicate groups")
    total_duplicate_files: int = Field(0, description="Total number of duplicate files")
    total_space_wasted: int = Field(0, description="Total space wasted in bytes")
    space_wasted_mb: float = Field(0.0, description="Space wasted in MB")
    space_wasted_gb: float = Field(0.0, description="Space wasted in GB")
    most_common_type: Optional[str] = Field(None, description="Most common duplicate file type")
    largest_group_size: int = Field(0, description="Largest duplicate group size")
    
    class Config:
        from_attributes = True
