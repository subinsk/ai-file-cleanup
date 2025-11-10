"""
Embedding cache service using SHA-256 hash
Avoids recomputing embeddings for files with the same content
"""
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from app.services.ml_client import ml_client

logger = logging.getLogger(__name__)

# In-memory cache for embeddings (fallback if DB not available)
_embedding_cache: Dict[str, Dict[str, List[float]]] = {
    'text': {},
    'image': {}
}


class EmbeddingCacheService:
    """Service for caching embeddings by SHA-256 hash"""
    
    async def get_or_generate_text_embeddings(
        self, 
        texts: List[str], 
        sha256_hashes: List[str]
    ) -> Tuple[List[List[float]], List[bool]]:
        """
        Get cached embeddings or generate new ones for texts
        
        Args:
            texts: List of text strings
            sha256_hashes: List of SHA-256 hashes corresponding to texts
            
        Returns:
            Tuple of (embeddings list, cache_hit flags)
        """
        if len(texts) != len(sha256_hashes):
            raise ValueError("texts and sha256_hashes must have the same length")
        
        embeddings = []
        cache_hits = []
        texts_to_generate = []
        indices_to_generate = []
        
        # Check cache for each text
        for i, (text, sha256) in enumerate(zip(texts, sha256_hashes)):
            cached_embedding = await self._get_cached_text_embedding(sha256)
            if cached_embedding:
                embeddings.append(cached_embedding)
                cache_hits.append(True)
                logger.debug(f"Cache hit for text with SHA-256: {sha256[:16]}...")
            else:
                embeddings.append(None)  # Placeholder
                cache_hits.append(False)
                texts_to_generate.append(text)
                indices_to_generate.append(i)
        
        # Generate embeddings for texts not in cache
        if texts_to_generate:
            logger.info(f"Generating {len(texts_to_generate)} new text embeddings (cache miss)")
            new_embeddings = await ml_client.generate_text_embeddings(texts_to_generate)
            
            # Store new embeddings in cache and fill in placeholders
            for idx, (new_emb, sha256) in enumerate(zip(new_embeddings, [sha256_hashes[i] for i in indices_to_generate])):
                original_idx = indices_to_generate[idx]
                embeddings[original_idx] = new_emb
                # Cache the embedding (async, don't wait)
                asyncio.create_task(self._cache_text_embedding(sha256, new_emb))
        
        return embeddings, cache_hits
    
    async def get_or_generate_image_embeddings(
        self, 
        images: List[str], 
        sha256_hashes: List[str]
    ) -> Tuple[List[List[float]], List[bool]]:
        """
        Get cached embeddings or generate new ones for images
        
        Args:
            images: List of base64-encoded image strings
            sha256_hashes: List of SHA-256 hashes corresponding to images
            
        Returns:
            Tuple of (embeddings list, cache_hit flags)
        """
        if len(images) != len(sha256_hashes):
            raise ValueError("images and sha256_hashes must have the same length")
        
        embeddings = []
        cache_hits = []
        images_to_generate = []
        indices_to_generate = []
        
        # Check cache for each image
        for i, (image, sha256) in enumerate(zip(images, sha256_hashes)):
            cached_embedding = await self._get_cached_image_embedding(sha256)
            if cached_embedding:
                embeddings.append(cached_embedding)
                cache_hits.append(True)
                logger.debug(f"Cache hit for image with SHA-256: {sha256[:16]}...")
            else:
                embeddings.append(None)  # Placeholder
                cache_hits.append(False)
                images_to_generate.append(image)
                indices_to_generate.append(i)
        
        # Generate embeddings for images not in cache
        if images_to_generate:
            logger.info(f"Generating {len(images_to_generate)} new image embeddings (cache miss)")
            new_embeddings = await ml_client.generate_image_embeddings(images_to_generate)
            
            # Store new embeddings in cache and fill in placeholders
            for idx, (new_emb, sha256) in enumerate(zip(new_embeddings, [sha256_hashes[i] for i in indices_to_generate])):
                original_idx = indices_to_generate[idx]
                embeddings[original_idx] = new_emb
                # Cache the embedding (async, don't wait)
                asyncio.create_task(self._cache_image_embedding(sha256, new_emb))
        
        return embeddings, cache_hits
    
    async def _get_cached_text_embedding(self, sha256: str) -> Optional[List[float]]:
        """Get cached text embedding by SHA-256 hash"""
        try:
            # Check in-memory cache first
            if sha256 in _embedding_cache['text']:
                logger.debug(f"In-memory cache hit for text SHA-256: {sha256[:16]}...")
                return _embedding_cache['text'][sha256]
            
            # Try to get from database if available
            try:
                from app.core.database import get_db
                db = get_db()
                
                # Find file by SHA-256
                files = await db.file.find_many(where={'sha256': sha256}, take=1)
                if files:
                    file = files[0]
                    # Get embedding for this file
                    embedding_record = await db.fileembedding.find_unique(
                        where={'fileId': file.id},
                        include={'file': True}
                    )
                    if embedding_record and embedding_record.embedding:
                        # Prisma returns vector as list or string, convert if needed
                        embedding_list = embedding_record.embedding
                        if isinstance(embedding_list, str):
                            # Parse vector string format
                            embedding_list = [float(x) for x in embedding_list.strip('[]').split(',')]
                        if isinstance(embedding_list, list):
                            _embedding_cache['text'][sha256] = embedding_list
                            return embedding_list
            except Exception as db_error:
                logger.debug(f"Database query failed (using in-memory cache only): {db_error}")
            
            return None
        except Exception as e:
            logger.warning(f"Error retrieving cached text embedding: {e}")
            return None
    
    async def _get_cached_image_embedding(self, sha256: str) -> Optional[List[float]]:
        """Get cached image embedding by SHA-256 hash"""
        try:
            # Check in-memory cache first
            if sha256 in _embedding_cache['image']:
                logger.debug(f"In-memory cache hit for image SHA-256: {sha256[:16]}...")
                return _embedding_cache['image'][sha256]
            
            # Try to get from database if available
            try:
                from app.core.database import get_db
                db = get_db()
                
                # Find file by SHA-256
                files = await db.file.find_many(where={'sha256': sha256}, take=1)
                if files:
                    file = files[0]
                    # Get embedding for this file
                    embedding_record = await db.fileembedding.find_unique(
                        where={'fileId': file.id},
                        include={'file': True}
                    )
                    if embedding_record and embedding_record.embeddingImg:
                        # Prisma returns vector as list or string, convert if needed
                        embedding_list = embedding_record.embeddingImg
                        if isinstance(embedding_list, str):
                            # Parse vector string format
                            embedding_list = [float(x) for x in embedding_list.strip('[]').split(',')]
                        if isinstance(embedding_list, list):
                            _embedding_cache['image'][sha256] = embedding_list
                            return embedding_list
            except Exception as db_error:
                logger.debug(f"Database query failed (using in-memory cache only): {db_error}")
            
            return None
        except Exception as e:
            logger.warning(f"Error retrieving cached image embedding: {e}")
            return None
    
    async def _cache_text_embedding(self, sha256: str, embedding: List[float]):
        """Cache text embedding by SHA-256 hash"""
        try:
            # Store in in-memory cache
            _embedding_cache['text'][sha256] = embedding
            
            # Try to store in database if available
            try:
                from app.core.database import get_db
                db = get_db()
                
                # Find file by SHA-256
                files = await db.file.find_many(where={'sha256': sha256}, take=1)
                if files:
                    file = files[0]
                    # Upsert embedding using Prisma
                    await db.fileembedding.upsert(
                        where={'fileId': file.id},
                        data={
                            'create': {
                                'fileId': file.id,
                                'kind': 'text',
                                'embedding': embedding
                            },
                            'update': {
                                'embedding': embedding
                            }
                        }
                    )
                    logger.debug(f"Cached text embedding in DB for SHA-256: {sha256[:16]}...")
            except Exception as db_error:
                logger.debug(f"Database cache failed (using in-memory only): {db_error}")
            
        except Exception as e:
            logger.warning(f"Error caching text embedding: {e}")
    
    async def _cache_image_embedding(self, sha256: str, embedding: List[float]):
        """Cache image embedding by SHA-256 hash"""
        try:
            # Store in in-memory cache
            _embedding_cache['image'][sha256] = embedding
            
            # Try to store in database if available
            try:
                from app.core.database import get_db
                db = get_db()
                
                # Find file by SHA-256
                files = await db.file.find_many(where={'sha256': sha256}, take=1)
                if files:
                    file = files[0]
                    # Upsert embedding using Prisma
                    await db.fileembedding.upsert(
                        where={'fileId': file.id},
                        data={
                            'create': {
                                'fileId': file.id,
                                'kind': 'image',
                                'embeddingImg': embedding
                            },
                            'update': {
                                'embeddingImg': embedding
                            }
                        }
                    )
                    logger.debug(f"Cached image embedding in DB for SHA-256: {sha256[:16]}...")
            except Exception as db_error:
                logger.debug(f"Database cache failed (using in-memory only): {db_error}")
            
        except Exception as e:
            logger.warning(f"Error caching image embedding: {e}")


# Global instance
embedding_cache = EmbeddingCacheService()

