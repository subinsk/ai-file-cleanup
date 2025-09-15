"""
Caching utilities for performance optimization
"""

import json
import pickle
from typing import Any, Optional, Union
from datetime import datetime, timedelta
import redis
import asyncio
from functools import wraps

class CacheManager:
    """Redis-based cache manager with fallback to memory cache"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        self.memory_cache: dict = {}
        self.use_redis = redis_client is not None
        self.default_ttl = 3600  # 1 hour
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self.use_redis:
            try:
                value = await self._get_redis(key)
                if value is not None:
                    return value
            except Exception:
                pass
        
        # Fallback to memory cache
        return self.memory_cache.get(key)
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        ttl = ttl or self.default_ttl
        
        if self.use_redis:
            try:
                return await self._set_redis(key, value, ttl)
            except Exception:
                pass
        
        # Fallback to memory cache
        self.memory_cache[key] = {
            'value': value,
            'expires': datetime.now() + timedelta(seconds=ttl)
        }
        return True
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if self.use_redis:
            try:
                await self._delete_redis(key)
            except Exception:
                pass
        
        # Remove from memory cache
        self.memory_cache.pop(key, None)
        return True
    
    async def clear(self) -> bool:
        """Clear all cache"""
        if self.use_redis:
            try:
                await self._clear_redis()
            except Exception:
                pass
        
        # Clear memory cache
        self.memory_cache.clear()
        return True
    
    async def _get_redis(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        value = self.redis_client.get(key)
        if value:
            try:
                return pickle.loads(value)
            except:
                # Try JSON decode as fallback
                return json.loads(value.decode())
        return None
    
    async def _set_redis(self, key: str, value: Any, ttl: int) -> bool:
        """Set value in Redis"""
        try:
            serialized = pickle.dumps(value)
            return self.redis_client.setex(key, ttl, serialized)
        except:
            # Fallback to JSON serialization
            serialized = json.dumps(value, default=str)
            return self.redis_client.setex(key, ttl, serialized)
    
    async def _delete_redis(self, key: str) -> bool:
        """Delete value from Redis"""
        return bool(self.redis_client.delete(key))
    
    async def _clear_redis(self) -> bool:
        """Clear Redis cache"""
        return bool(self.redis_client.flushdb())

def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = await cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator

# Global cache manager instance
cache_manager = CacheManager()

# Cache keys for different data types
class CacheKeys:
    """Standard cache key patterns"""
    
    @staticmethod
    def file_metadata(file_path: str) -> str:
        return f"file_metadata:{hash(file_path)}"
    
    @staticmethod
    def duplicate_groups(session_id: str) -> str:
        return f"duplicate_groups:{session_id}"
    
    @staticmethod
    def scan_progress(session_id: str) -> str:
        return f"scan_progress:{session_id}"
    
    @staticmethod
    def file_classification(file_path: str) -> str:
        return f"file_classification:{hash(file_path)}"
    
    @staticmethod
    def duplicate_stats() -> str:
        return "duplicate_stats:global"
    
    @staticmethod
    def ml_model_prediction(model_name: str, input_hash: str) -> str:
        return f"ml_prediction:{model_name}:{input_hash}"
