"""
Rate limiting middleware for API endpoints
"""
import time
from typing import Dict, Optional
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        # Store request counts per user/IP
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 60  # Cleanup old entries every 60 seconds
        self.last_cleanup = time.time()
    
    def is_allowed(
        self, 
        key: str, 
        max_requests: int = 100, 
        window_seconds: int = 60
    ) -> bool:
        """
        Check if request is allowed
        
        Args:
            key: Unique identifier (user ID or IP address)
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            True if request is allowed, False otherwise
        """
        now = time.time()
        
        # Cleanup old entries periodically
        if now - self.last_cleanup > self.cleanup_interval:
            self._cleanup(now, window_seconds)
            self.last_cleanup = now
        
        # Get requests in current window
        window_start = now - window_seconds
        recent_requests = [
            req_time for req_time in self.requests[key]
            if req_time > window_start
        ]
        
        # Update requests list
        self.requests[key] = recent_requests
        
        # Check if limit exceeded
        if len(recent_requests) >= max_requests:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True
    
    def _cleanup(self, now: float, window_seconds: int):
        """Remove old entries from memory"""
        window_start = now - window_seconds
        keys_to_remove = []
        
        for key, requests in self.requests.items():
            self.requests[key] = [
                req_time for req_time in requests
                if req_time > window_start
            ]
            if not self.requests[key]:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.requests[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce rate limiting"""
    
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    async def dispatch(self, request: Request, call_next):
        # Get client identifier (IP address or user ID)
        client_ip = request.client.host if request.client else "unknown"
        
        # Try to get user ID from request state (set by auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        identifier = user_id or client_ip
        
        # Check rate limit
        if not rate_limiter.is_allowed(
            identifier,
            max_requests=self.max_requests,
            window_seconds=self.window_seconds
        ):
            logger.warning(f"Rate limit exceeded for {identifier}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds} seconds."
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Window"] = str(self.window_seconds)
        
        return response


def get_rate_limit_key(request: Request) -> str:
    """Get rate limit key from request"""
    user_id = getattr(request.state, 'user_id', None)
    client_ip = request.client.host if request.client else "unknown"
    return user_id or client_ip

