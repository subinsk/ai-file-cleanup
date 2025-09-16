"""
WebSocket connection manager for real-time updates
"""

from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio


class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Dictionary to store active connections by session_id
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        
        self.active_connections[session_id].append(websocket)
        print(f"✅ WebSocket connected for session: {session_id}")
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove a WebSocket connection"""
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            
            # Clean up empty session
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        
        print(f"❌ WebSocket disconnected for session: {session_id}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to a specific WebSocket connection"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
    
    async def send_to_session(self, message: dict, session_id: str):
        """Send message to all connections in a session"""
        if session_id in self.active_connections:
            message_text = json.dumps(message)
            disconnected = []
            
            for websocket in self.active_connections[session_id]:
                try:
                    await websocket.send_text(message_text)
                except Exception as e:
                    print(f"Error sending to session {session_id}: {e}")
                    disconnected.append(websocket)
            
            # Remove disconnected websockets
            for ws in disconnected:
                self.active_connections[session_id].remove(ws)
    
    async def broadcast_scan_progress(self, session_id: str, progress: dict):
        """Broadcast scan progress to session"""
        message = {
            "type": "scan_progress",
            "session_id": session_id,
            "data": progress
        }
        await self.send_to_session(message, session_id)
    
    async def broadcast_duplicate_found(self, session_id: str, duplicate_data: dict):
        """Broadcast duplicate detection results"""
        message = {
            "type": "duplicate_found",
            "session_id": session_id,
            "data": duplicate_data
        }
        await self.send_to_session(message, session_id)
    
    async def broadcast_cleanup_status(self, session_id: str, cleanup_data: dict):
        """Broadcast cleanup operation status"""
        message = {
            "type": "cleanup_status",
            "session_id": session_id,
            "data": cleanup_data
        }
        await self.send_to_session(message, session_id)
    
    def get_connection_count(self, session_id: str = None) -> int:
        """Get number of active connections"""
        if session_id:
            return len(self.active_connections.get(session_id, []))
        return sum(len(connections) for connections in self.active_connections.values())


# Create a global instance
websocket_manager = WebSocketManager()