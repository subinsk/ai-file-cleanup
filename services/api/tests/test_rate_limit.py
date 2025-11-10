"""
Tests for rate limiting
"""
import pytest
import time
from app.middleware.rate_limit import RateLimiter


def test_rate_limiter_allows_requests():
    """Test that rate limiter allows requests within limit"""
    limiter = RateLimiter()
    
    # Make requests within limit
    for i in range(10):
        assert limiter.is_allowed("test_key", max_requests=10, window_seconds=60) is True
    
    # 11th request should be blocked
    assert limiter.is_allowed("test_key", max_requests=10, window_seconds=60) is False


def test_rate_limiter_resets_after_window():
    """Test that rate limiter resets after time window"""
    limiter = RateLimiter()
    
    # Exhaust limit
    for i in range(5):
        limiter.is_allowed("test_key", max_requests=5, window_seconds=1)
    
    # Should be blocked
    assert limiter.is_allowed("test_key", max_requests=5, window_seconds=1) is False
    
    # Wait for window to expire
    time.sleep(1.1)
    
    # Should be allowed again
    assert limiter.is_allowed("test_key", max_requests=5, window_seconds=1) is True


def test_rate_limiter_different_keys():
    """Test that rate limiter tracks different keys separately"""
    limiter = RateLimiter()
    
    # Exhaust limit for key1
    for i in range(5):
        limiter.is_allowed("key1", max_requests=5, window_seconds=60)
    
    # key1 should be blocked
    assert limiter.is_allowed("key1", max_requests=5, window_seconds=60) is False
    
    # key2 should still be allowed
    assert limiter.is_allowed("key2", max_requests=5, window_seconds=60) is True

