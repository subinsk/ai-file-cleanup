"""
Rate limiting middleware for API protection
"""

import time
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import redis
from collections import defaultdict, deque

class RateLimiter:
    """Rate limiter using sliding window algorithm"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        self.local_cache: Dict[str, deque] = defaultdict(deque)
        self.use_redis = redis_client is not None
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Check if request is allowed based on rate limit"""
        current_time = time.time()
        
        if self.use_redis:
            return self._check_redis_limit(key, limit, window, current_time)
        else:
            return self._check_local_limit(key, limit, window, current_time)
    
    def _check_redis_limit(self, key: str, limit: int, window: int, current_time: float) -> bool:
        """Check rate limit using Redis"""
        try:
            pipe = self.redis_client.pipeline()
            
            # Remove expired entries
            pipe.zremrangebyscore(key, 0, current_time - window)
            
            # Count current requests
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(key, window)
            
            results = pipe.execute()
            current_count = results[1]
            
            return current_count < limit
            
        except Exception:
            # Fallback to local rate limiting if Redis fails
            return self._check_local_limit(key, limit, window, current_time)
    
    def _check_local_limit(self, key: str, limit: int, window: int, current_time: float) -> bool:
        """Check rate limit using local memory"""
        request_times = self.local_cache[key]
        
        # Remove expired requests
        while request_times and request_times[0] <= current_time - window:
            request_times.popleft()
        
        # Check if under limit
        if len(request_times) < limit:
            request_times.append(current_time)
            return True
        
        return False

class RateLimitMiddleware:
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.rate_limiter = RateLimiter(redis_client)
        self.default_limit = 100  # requests per minute
        self.default_window = 60  # seconds
        
        # Different limits for different endpoints
        self.endpoint_limits = {
            "/api/scan/start": (10, 60),  # 10 requests per minute
            "/api/cleanup/execute": (5, 60),  # 5 requests per minute
            "/api/duplicates": (50, 60),  # 50 requests per minute
            "/api/files": (100, 60),  # 100 requests per minute
        }
    
    async def __call__(self, request: Request, call_next):
        """Rate limiting middleware"""
        
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health"]:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get rate limit for endpoint
        limit, window = self.endpoint_limits.get(request.url.path, (self.default_limit, self.default_window))
        
        # Create rate limit key
        rate_key = f"rate_limit:{client_ip}:{request.url.path}"
        
        # Check rate limit
        if not self.rate_limiter.is_allowed(rate_key, limit, window):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {limit} requests per {window} seconds.",
                    "retry_after": window
                },
                headers={"Retry-After": str(window)}
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Window"] = str(window)
        
        return response

# Global rate limiter instance
rate_limiter = RateLimiter()