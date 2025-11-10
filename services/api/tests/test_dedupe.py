"""
Tests for deduplication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_dedupe_preview_no_auth():
    """Test that dedupe preview requires authentication"""
    response = client.post("/dedupe/preview", json={"files": []})
    assert response.status_code in [401, 403]  # Unauthorized or Forbidden


def test_dedupe_preview_empty_files():
    """Test dedupe preview with empty file list"""
    # This would require authentication token
    # For now, just test the endpoint exists
    response = client.post("/dedupe/preview", json={"files": []})
    # Should return 401/403 without auth, or 422 with validation error
    assert response.status_code in [401, 403, 422]


def test_dedupe_preview_validation():
    """Test file validation in dedupe preview"""
    # Test with too many files
    too_many_files = [{"fileName": f"file_{i}.txt", "sizeBytes": 1000} for i in range(101)]
    response = client.post("/dedupe/preview", json={"files": too_many_files})
    # Should return validation error (401/403 without auth, or 422 with validation)
    assert response.status_code in [401, 403, 422]


@pytest.mark.asyncio
async def test_file_validation():
    """Test file validation function"""
    from app.middleware.validation import validate_file_upload
    
    # Valid files
    valid_files = [
        {"name": "file1.txt", "size": 1000},
        {"name": "file2.txt", "size": 2000},
    ]
    result = validate_file_upload(valid_files, max_files=10, max_file_size=1024 * 1024)
    assert result["valid"] is True
    assert len(result["errors"]) == 0
    
    # Too many files
    too_many = [{"name": f"file_{i}.txt", "size": 1000} for i in range(11)]
    result = validate_file_upload(too_many, max_files=10, max_file_size=1024 * 1024)
    assert result["valid"] is False
    assert len(result["errors"]) > 0
    
    # File too large
    large_file = [{"name": "large.txt", "size": 2 * 1024 * 1024}]
    result = validate_file_upload(large_file, max_files=10, max_file_size=1024 * 1024)
    assert result["valid"] is False
    assert len(result["errors"]) > 0

