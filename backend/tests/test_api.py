"""
Comprehensive API tests
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.models import file, duplicate, scan_session

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    """Create test client"""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def test_data():
    """Create test data"""
    return {
        "directory_path": "/test/directory",
        "file_path": "/test/directory/test_file.txt",
        "file_content": "This is a test file content"
    }

class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "AI File Management System API"
    
    def test_health_endpoint(self, client):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_api_health_endpoint(self, client):
        """Test API health endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

class TestScanEndpoints:
    """Test scan-related endpoints"""
    
    def test_start_scan_success(self, client, test_data):
        """Test successful scan start"""
        response = client.post(
            "/api/scan/start",
            json={
                "directory_path": test_data["directory_path"],
                "include_subdirectories": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["status"] == "started"
    
    def test_start_scan_invalid_path(self, client):
        """Test scan start with invalid path"""
        response = client.post(
            "/api/scan/start",
            json={
                "directory_path": "/nonexistent/path",
                "include_subdirectories": True
            }
        )
        # Should still return 200 as scan starts but will fail later
        assert response.status_code == 200
    
    def test_get_scan_status_invalid_id(self, client):
        """Test getting scan status with invalid ID"""
        response = client.get("/api/scan/status/invalid-id")
        assert response.status_code == 400
    
    def test_get_scan_sessions(self, client):
        """Test getting scan sessions"""
        response = client.get("/api/scan/sessions")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestDuplicateEndpoints:
    """Test duplicate-related endpoints"""
    
    def test_get_duplicates(self, client):
        """Test getting duplicates"""
        response = client.get("/api/duplicates")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_duplicate_stats(self, client):
        """Test getting duplicate stats"""
        response = client.get("/api/duplicates/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_duplicate_groups" in data
        assert "total_duplicate_files" in data
        assert "total_space_wasted" in data

class TestCleanupEndpoints:
    """Test cleanup-related endpoints"""
    
    def test_execute_cleanup_dry_run(self, client):
        """Test cleanup execution with dry run"""
        response = client.post(
            "/api/cleanup/execute",
            json={
                "rules": [{
                    "action": "delete_duplicates",
                    "dry_run": True,
                    "keep_primary": True
                }],
                "confirm": False,
                "backup": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "cleanup_id" in data
        assert data["status"] == "started"
    
    def test_get_cleanup_status(self, client):
        """Test getting cleanup status"""
        response = client.get("/api/cleanup/status/test-cleanup-id")
        assert response.status_code == 200
        data = response.json()
        assert "cleanup_id" in data
        assert "status" in data

class TestFileEndpoints:
    """Test file-related endpoints"""
    
    def test_get_files(self, client):
        """Test getting files"""
        response = client.get("/api/files")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_files_with_filters(self, client):
        """Test getting files with filters"""
        response = client.get("/api/files?category=document&limit=10")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_delete_file_invalid_id(self, client):
        """Test deleting file with invalid ID"""
        response = client.delete("/api/files/invalid-id")
        assert response.status_code == 200  # Should return success even if file doesn't exist

class TestWebSocket:
    """Test WebSocket functionality"""
    
    def test_websocket_connection(self, client):
        """Test WebSocket connection"""
        with client.websocket_connect("/ws/test-session") as websocket:
            # Send a test message
            websocket.send_text("test message")
            # Receive response
            data = websocket.receive_text()
            assert "Echo: test message" in data

class TestErrorHandling:
    """Test error handling"""
    
    def test_invalid_json(self, client):
        """Test handling of invalid JSON"""
        response = client.post(
            "/api/scan/start",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client):
        """Test handling of missing required fields"""
        response = client.post(
            "/api/scan/start",
            json={}
        )
        assert response.status_code == 422
    
    def test_invalid_endpoint(self, client):
        """Test handling of invalid endpoint"""
        response = client.get("/api/invalid-endpoint")
        assert response.status_code == 404

if __name__ == "__main__":
    pytest.main([__file__])
