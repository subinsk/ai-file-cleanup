"""
Embedding cache service with SHA-256 based caching
Avoids recomputation of embeddings for identical inputs
"""
import hashlib
import logging
from typing import Dict, List, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingCache:
    """
    In-memory cache for embeddings with SHA-256 hashing
    Can be extended to use Redis or database persistence
    """
    
    def __init__(self, max_size: int = 10000):
        self.cache: Dict[str, Tuple[List[float], str]] = {}
        self.max_size = max_size
        self.hits = 0
        self.misses = 0
        self.evictions = 0
    
    @staticmethod
    def compute_hash(content: str) -> str:
        """
        Compute SHA-256 hash of content
        
        Args:
            content: Content to hash (text or base64 image)
            
        Returns:
            SHA-256 hash as hex string
        """
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def get(self, content: str) -> Optional[List[float]]:
        """
        Get cached embedding for content
        
        Args:
            content: Content to look up
            
        Returns:
            Embedding if found, None otherwise
        """
        content_hash = self.compute_hash(content)
        
        if content_hash in self.cache:
            embedding, original_content_hash = self.cache[content_hash]
            self.hits += 1
            logger.debug(f"Cache hit for {content_hash[:16]}... (hits: {self.hits}, misses: {self.misses})")
            return embedding
        
        self.misses += 1
        return None
    
    def put(self, content: str, embedding: List[float]) -> bool:
        """
        Cache embedding for content
        
        Args:
            content: Content string
            embedding: Embedding vector
            
        Returns:
            True if cached, False if cache full (uses LRU eviction)
        """
        content_hash = self.compute_hash(content)
        
        # Check if already cached
        if content_hash in self.cache:
            logger.debug(f"Content already cached: {content_hash[:16]}...")
            return True
        
        # Check cache size
        if len(self.cache) >= self.max_size:
            # Simple eviction: remove first (oldest) entry
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
            self.evictions += 1
            logger.debug(f"Cache eviction (total: {self.evictions})")
        
        # Store in cache
        self.cache[content_hash] = (embedding, content_hash)
        logger.debug(f"Cached embedding for {content_hash[:16]}... (size: {len(self.cache)}/{self.max_size})")
        return True
    
    def get_batch(self, contents: List[str]) -> Tuple[List[Optional[List[float]]], List[int]]:
        """
        Get cached embeddings for batch of contents
        
        Args:
            contents: List of content strings
            
        Returns:
            Tuple of (embeddings list, indices of uncached items)
        """
        embeddings = []
        uncached_indices = []
        
        for i, content in enumerate(contents):
            embedding = self.get(content)
            if embedding is None:
                embeddings.append(None)
                uncached_indices.append(i)
            else:
                embeddings.append(embedding)
        
        return embeddings, uncached_indices
    
    def put_batch(self, contents: List[str], embeddings: List[List[float]]) -> None:
        """
        Cache batch of embeddings
        
        Args:
            contents: List of content strings
            embeddings: List of embeddings (parallel to contents)
        """
        if len(contents) != len(embeddings):
            logger.warning("Content and embedding counts don't match")
            return
        
        for content, embedding in zip(contents, embeddings):
            self.put(content, embedding)
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'evictions': self.evictions,
            'hit_rate_percent': round(hit_rate, 2),
        }
    
    def clear(self) -> None:
        """Clear cache"""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def reset_stats(self) -> None:
        """Reset statistics"""
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        logger.info("Cache statistics reset")


# Global cache instance
_embedding_cache = EmbeddingCache(max_size=settings.EMBEDDING_CACHE_SIZE if hasattr(settings, 'EMBEDDING_CACHE_SIZE') else 10000)


def get_embedding_cache() -> EmbeddingCache:
    """Get global embedding cache instance"""
    return _embedding_cache
