"""
Pydantic schemas for cleanup operations
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class CleanupAction(str, Enum):
    """Available cleanup actions"""
    DELETE_DUPLICATES = "delete_duplicates"
    MOVE_TO_TRASH = "move_to_trash"
    ARCHIVE_OLD = "archive_old"
    ORGANIZE_BY_TYPE = "organize_by_type"


class CleanupRule(BaseModel):
    """Individual cleanup rule"""
    action: CleanupAction = Field(..., description="Cleanup action to perform")
    target_duplicate_groups: Optional[List[str]] = Field(None, description="Specific duplicate groups to target")
    file_types: Optional[List[str]] = Field(None, description="File types to target")
    min_similarity_score: float = Field(0.8, description="Minimum similarity score for duplicates")
    keep_primary: bool = Field(True, description="Keep the primary file in duplicate groups")
    dry_run: bool = Field(False, description="Preview changes without executing")


class CleanupRequest(BaseModel):
    """Request schema for cleanup operations"""
    rules: List[CleanupRule] = Field(..., description="Cleanup rules to apply")
    session_id: Optional[str] = Field(None, description="Scan session to clean up")
    confirm: bool = Field(False, description="Confirm execution of destructive operations")
    backup: bool = Field(True, description="Create backup before cleanup")


class CleanupResponse(BaseModel):
    """Response schema for cleanup operations"""
    cleanup_id: str = Field(..., description="Unique cleanup operation identifier")
    status: str = Field(..., description="Cleanup status")
    message: str = Field(..., description="Response message")
    estimated_files_affected: Optional[int] = Field(None, description="Estimated files to be affected")
    estimated_space_freed: Optional[int] = Field(None, description="Estimated space to be freed")


class CleanupStatus(BaseModel):
    """Schema for cleanup operation status"""
    cleanup_id: str = Field(..., description="Cleanup operation identifier")
    status: str = Field(..., description="Current status: pending, running, completed, failed")
    progress_percentage: float = Field(0.0, description="Progress percentage (0-100)")
    files_processed: int = Field(0, description="Files processed")
    files_removed: int = Field(0, description="Files removed")
    space_freed: int = Field(0, description="Space freed in bytes")
    space_freed_mb: float = Field(0.0, description="Space freed in MB")
    space_freed_gb: float = Field(0.0, description="Space freed in GB")
    errors_count: int = Field(0, description="Number of errors encountered")
    started_at: Optional[str] = Field(None, description="Cleanup start time")
    completed_at: Optional[str] = Field(None, description="Cleanup completion time")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    
    class Config:
        from_attributes = True


class CleanupPreview(BaseModel):
    """Preview of cleanup operations"""
    files_to_remove: List[Dict[str, Any]] = Field(..., description="Files that will be removed")
    files_to_move: List[Dict[str, Any]] = Field(..., description="Files that will be moved")
    space_to_free: int = Field(..., description="Space that will be freed")
    space_to_free_mb: float = Field(..., description="Space to free in MB")
    space_to_free_gb: float = Field(..., description="Space to free in GB")
    total_operations: int = Field(..., description="Total operations to perform")
    
    class Config:
        from_attributes = True
