"""
AI File Management System - Main FastAPI Application
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import json
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import api_router
from app.core.websocket_manager import WebSocketManager


# WebSocket manager instance
websocket_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    print("🚀 AI File Management System started!")
    yield
    # Shutdown
    print("👋 AI File Management System shutdown!")


# Create FastAPI app
app = FastAPI(
    title="AI File Management System",
    description="Intelligent file management with ML-powered duplicate detection",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI File Management System API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-file-cleanup"}


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time updates"""
    try:
        await websocket_manager.connect(websocket, session_id)
        
        # Send initial connection confirmation
        await websocket_manager.send_personal_message(
            json.dumps({
                "type": "connection_confirmed",
                "session_id": session_id,
                "data": {"message": "WebSocket connected successfully"}
            }), 
            websocket
        )
        
        while True:
            try:
                # Keep connection alive and handle incoming messages
                data = await websocket.receive_text()
                
                # Try to parse incoming message
                try:
                    message = json.loads(data)
                    message_type = message.get('type', 'unknown')
                    
                    if message_type == 'ping':
                        # Respond to ping with pong
                        await websocket_manager.send_personal_message(
                            json.dumps({
                                "type": "pong",
                                "session_id": session_id,
                                "data": {"timestamp": message.get('timestamp')}
                            }), 
                            websocket
                        )
                    else:
                        # Echo back other messages for now
                        await websocket_manager.send_personal_message(f"Echo: {data}", websocket)
                        
                except json.JSONDecodeError:
                    # Handle non-JSON messages
                    await websocket_manager.send_personal_message(f"Echo: {data}", websocket)
                    
            except WebSocketDisconnect:
                # Handle WebSocket disconnect gracefully
                print(f"WebSocket disconnected during message processing for session: {session_id}")
                break
            except Exception as e:
                # Log the error but don't break the connection for minor issues
                error_str = str(e)
                if "1001" in error_str:
                    print(f"Client disconnected (page reload/close) for session {session_id}")
                    break
                else:
                    print(f"Error processing WebSocket message for session {session_id}: {e}")
                    # Don't break for other errors, continue processing
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected normally for session: {session_id}")
    except Exception as e:
        print(f"Unexpected error in WebSocket for session {session_id}: {e}")
    finally:
        websocket_manager.disconnect(websocket, session_id)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
