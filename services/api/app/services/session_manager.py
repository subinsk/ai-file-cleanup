"""
Session Manager for File Upload Processing
Handles upload sessions, progress tracking, and result storage
"""
import os
import json
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class UploadSession:
    def __init__(self, session_id: str, user_id: str):
        self.session_id = session_id
        self.user_id = user_id
        self.created_at = datetime.utcnow()
        self.status = "uploading"  # uploading, processing, completed, failed
        self.progress = 0
        self.total_files = 0
        self.processed_files = 0
        self.failed_files = 0
        self.duplicate_groups = []
        self.processing_stats = {}
        self.error_message = None
        self.temp_dir = Path(f"temp_files/{session_id}")
        self.results_file = self.temp_dir / "results.json"
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "progress": self.progress,
            "total_files": self.total_files,
            "processed_files": self.processed_files,
            "failed_files": self.failed_files,
            "duplicate_groups": self.duplicate_groups,
            "processing_stats": self.processing_stats,
            "error_message": self.error_message,
            "temp_dir": str(self.temp_dir)
        }

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, UploadSession] = {}
        # Use absolute path to ensure temp_files is created in the right location
        self.temp_base_dir = Path(__file__).parent.parent.parent / "temp_files"
        self.temp_base_dir.mkdir(exist_ok=True)
        logger.info(f"SessionManager initialized with temp_base_dir: {self.temp_base_dir}")
        
    async def create_session(self, user_id: str) -> UploadSession:
        """Create a new upload session"""
        session_id = str(uuid.uuid4())
        session = UploadSession(session_id, user_id)
        
        # Create temp directory for this session
        session.temp_dir.mkdir(parents=True, exist_ok=True)
        
        self.sessions[session_id] = session
        logger.info(f"Created upload session {session_id} for user {user_id}")
        
        return session
    
    async def get_session(self, session_id: str) -> Optional[UploadSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    async def update_session_progress(self, session_id: str, **kwargs):
        """Update session progress"""
        session = self.sessions.get(session_id)
        if not session:
            return
            
        for key, value in kwargs.items():
            if hasattr(session, key):
                setattr(session, key, value)
                
        # Save progress to file for persistence
        await self.save_session_state(session)
        
    async def save_session_state(self, session: UploadSession):
        """Save session state to file"""
        try:
            with open(session.results_file, 'w') as f:
                json.dump(session.to_dict(), f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save session state: {e}")
    
    async def load_session_state(self, session_id: str) -> Optional[UploadSession]:
        """Load session state from file"""
        try:
            results_file = self.temp_base_dir / session_id / "results.json"
            if results_file.exists():
                with open(results_file, 'r') as f:
                    data = json.load(f)
                
                session = UploadSession(session_id, data["user_id"])
                session.created_at = datetime.fromisoformat(data["created_at"])
                session.status = data["status"]
                session.progress = data["progress"]
                session.total_files = data["total_files"]
                session.processed_files = data["processed_files"]
                session.failed_files = data["failed_files"]
                session.duplicate_groups = data["duplicate_groups"]
                session.processing_stats = data["processing_stats"]
                session.error_message = data["error_message"]
                
                return session
        except Exception as e:
            logger.error(f"Failed to load session state: {e}")
        
        return None
    
    async def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Clean up old sessions and their temp files"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        sessions_to_remove = []
        for session_id, session in self.sessions.items():
            if session.created_at < cutoff_time:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            await self.cleanup_session(session_id)
    
    async def cleanup_session(self, session_id: str):
        """Clean up session and its temp files"""
        session = self.sessions.get(session_id)
        if session and session.temp_dir.exists():
            import shutil
            shutil.rmtree(session.temp_dir)
            
        if session_id in self.sessions:
            del self.sessions[session_id]
            
        logger.info(f"Cleaned up session {session_id}")

# Global session manager instance
session_manager = SessionManager()
