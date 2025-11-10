# API Test Suite

This directory contains tests for the API service.

## Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run specific test file
pytest tests/test_dedupe.py

# Run with coverage
pytest --cov=app --cov-report=html
```

## Test Structure

- `test_dedupe.py` - Tests for deduplication endpoints
- `test_rate_limit.py` - Tests for rate limiting functionality
- `test_validation.py` - Tests for request validation

## Writing Tests

Tests use pytest and FastAPI's TestClient. Example:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
```
