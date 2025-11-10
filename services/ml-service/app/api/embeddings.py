"""
Embedding generation endpoints with caching and batch processing support
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.text_embeddings import generate_text_embeddings
from app.services.image_embeddings import generate_image_embeddings
from app.services.embedding_cache import get_embedding_cache
from app.services.batch_processor import get_batch_processor
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
cache = get_embedding_cache()
batch_processor = get_batch_processor()


# Request/Response models
class TextEmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=settings.MAX_BATCH_SIZE)


class ImageEmbeddingRequest(BaseModel):
    images: List[str] = Field(..., min_items=1, max_items=settings.MAX_BATCH_SIZE)
    # images should be base64 encoded strings


class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    count: int
    dimension: int


@router.post("/text", response_model=EmbeddingResponse)
async def embed_text(request: TextEmbeddingRequest):
    """
    Generate embeddings for text with SHA-256 caching
    
    **Request:**
    - texts: List of text strings (1-32 items)
    
    **Response:**
    - embeddings: List of embedding vectors
    - count: Number of embeddings
    - dimension: Embedding dimension (384 for MiniLM)
    """
    try:
        logger.info(f"Generating embeddings for {len(request.texts)} texts")
        
        # Check cache for existing embeddings
        cached_embeddings, uncached_indices = cache.get_batch(request.texts)
        
        # Only generate embeddings for uncached items
        embeddings_to_generate = [request.texts[i] for i in uncached_indices]
        
        if embeddings_to_generate:
            logger.info(f"Cache miss for {len(embeddings_to_generate)} texts, generating...")
            new_embeddings = await generate_text_embeddings(embeddings_to_generate)
            
            # Cache the new embeddings
            cache.put_batch(embeddings_to_generate, new_embeddings)
        else:
            logger.info("All embeddings found in cache")
            new_embeddings = []
        
        # Reconstruct full embedding list in original order
        final_embeddings = []
        new_embedding_idx = 0
        for i in range(len(request.texts)):
            if cached_embeddings[i] is not None:
                final_embeddings.append(cached_embeddings[i])
            else:
                final_embeddings.append(new_embeddings[new_embedding_idx])
                new_embedding_idx += 1
        
        # Log cache stats
        stats = cache.get_stats()
        logger.info(f"Cache stats: {stats}")
        
        return {
            "embeddings": final_embeddings,
            "count": len(final_embeddings),
            "dimension": len(final_embeddings[0]) if final_embeddings else 0,
        }
    except Exception as e:
        logger.error(f"Text embedding failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")


@router.post("/image", response_model=EmbeddingResponse)
async def embed_image(request: ImageEmbeddingRequest):
    """
    Generate embeddings for images with SHA-256 caching
    
    **Request:**
    - images: List of base64 encoded images (1-32 items)
    
    **Response:**
    - embeddings: List of embedding vectors
    - count: Number of embeddings
    - dimension: Embedding dimension (512 for CLIP)
    """
    try:
        logger.info(f"Generating embeddings for {len(request.images)} images")
        
        # Check cache for existing embeddings
        cached_embeddings, uncached_indices = cache.get_batch(request.images)
        
        # Only generate embeddings for uncached items
        images_to_generate = [request.images[i] for i in uncached_indices]
        
        if images_to_generate:
            logger.info(f"Cache miss for {len(images_to_generate)} images, generating...")
            new_embeddings = await generate_image_embeddings(images_to_generate)
            
            # Cache the new embeddings
            cache.put_batch(images_to_generate, new_embeddings)
        else:
            logger.info("All embeddings found in cache")
            new_embeddings = []
        
        # Reconstruct full embedding list in original order
        final_embeddings = []
        new_embedding_idx = 0
        for i in range(len(request.images)):
            if cached_embeddings[i] is not None:
                final_embeddings.append(cached_embeddings[i])
            else:
                final_embeddings.append(new_embeddings[new_embedding_idx])
                new_embedding_idx += 1
        
        # Log cache stats
        stats = cache.get_stats()
        logger.info(f"Cache stats: {stats}")
        
        return {
            "embeddings": final_embeddings,
            "count": len(final_embeddings),
            "dimension": len(final_embeddings[0]) if final_embeddings else 0,
        }
    except Exception as e:
        logger.error(f"Image embedding failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")


@router.post("/single/text")
async def embed_single_text(text: str):
    """
    Generate embedding for a single text (convenience endpoint)
    """
    try:
        embeddings = await generate_text_embeddings([text])
        return {"embedding": embeddings[0], "dimension": len(embeddings[0])}
    except Exception as e:
        logger.error(f"Text embedding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


@router.post("/single/image")
async def embed_single_image(image: str):
    """
    Generate embedding for a single image (convenience endpoint)
    """
    try:
        embeddings = await generate_image_embeddings([image])
        return {"embedding": embeddings[0], "dimension": len(embeddings[0])}
    except Exception as e:
        logger.error(f"Image embedding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


@router.get("/cache/stats")
async def get_cache_stats():
    """
    Get embedding cache statistics
    
    **Response:**
    - size: Current cache size
    - max_size: Maximum cache size
    - hits: Number of cache hits
    - misses: Number of cache misses
    - evictions: Number of evictions
    - hit_rate_percent: Cache hit rate percentage
    """
    return cache.get_stats()


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear the embedding cache
    """
    cache.clear()
    return {"message": "Cache cleared"}


@router.post("/cache/reset-stats")
async def reset_cache_stats():
    """
    Reset cache statistics
    """
    cache.reset_stats()
    return {"message": "Cache statistics reset"}


# Batch processing endpoints with progress tracking
class BatchTextRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=1000)
    use_cache: bool = Field(default=True)


class BatchImageRequest(BaseModel):
    images: List[str] = Field(..., min_items=1, max_items=500)
    use_cache: bool = Field(default=True)


class BatchEmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    count: int
    dimension: int
    cached_count: int
    generated_count: int


@router.post("/batch/text", response_model=BatchEmbeddingResponse)
async def batch_embed_text(request: BatchTextRequest):
    """
    Generate embeddings for large batch of texts
    
    **Request:**
    - texts: List of text strings (1-1000 items)
    - use_cache: Whether to use caching (default: true)
    
    **Response:**
    - embeddings: List of embedding vectors
    - count: Total number of embeddings
    - dimension: Embedding dimension
    - cached_count: Number of cached results
    - generated_count: Number of newly generated results
    """
    try:
        logger.info(f"Batch processing {len(request.texts)} texts (use_cache={request.use_cache})")
        
        cached_count = 0
        
        if request.use_cache:
            # Check cache for existing embeddings
            cached_embeddings, uncached_indices = cache.get_batch(request.texts)
            cached_count = len(request.texts) - len(uncached_indices)
            
            # Only generate embeddings for uncached items
            texts_to_generate = [request.texts[i] for i in uncached_indices]
            
            if texts_to_generate:
                logger.info(f"Batch cache miss for {len(texts_to_generate)} texts, generating...")
                new_embeddings, _ = await batch_processor.process_text_batch(texts_to_generate)
                cache.put_batch(texts_to_generate, new_embeddings)
            else:
                logger.info("All embeddings found in batch cache")
                new_embeddings = []
            
            # Reconstruct full embedding list in original order
            final_embeddings = []
            new_embedding_idx = 0
            for i in range(len(request.texts)):
                if cached_embeddings[i] is not None:
                    final_embeddings.append(cached_embeddings[i])
                else:
                    final_embeddings.append(new_embeddings[new_embedding_idx])
                    new_embedding_idx += 1
        else:
            # Skip cache and generate directly
            final_embeddings, _ = await batch_processor.process_text_batch(request.texts)
        
        logger.info(f"Batch embedding complete: {cached_count} cached, {len(request.texts) - cached_count} generated")
        
        return {
            "embeddings": final_embeddings,
            "count": len(final_embeddings),
            "dimension": len(final_embeddings[0]) if final_embeddings else 0,
            "cached_count": cached_count,
            "generated_count": len(request.texts) - cached_count,
        }
    except Exception as e:
        logger.error(f"Batch text embedding failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate batch embeddings: {str(e)}")


@router.post("/batch/image", response_model=BatchEmbeddingResponse)
async def batch_embed_image(request: BatchImageRequest):
    """
    Generate embeddings for large batch of images
    
    **Request:**
    - images: List of base64 encoded images (1-500 items)
    - use_cache: Whether to use caching (default: true)
    
    **Response:**
    - embeddings: List of embedding vectors
    - count: Total number of embeddings
    - dimension: Embedding dimension
    - cached_count: Number of cached results
    - generated_count: Number of newly generated results
    """
    try:
        logger.info(f"Batch processing {len(request.images)} images (use_cache={request.use_cache})")
        
        cached_count = 0
        
        if request.use_cache:
            # Check cache for existing embeddings
            cached_embeddings, uncached_indices = cache.get_batch(request.images)
            cached_count = len(request.images) - len(uncached_indices)
            
            # Only generate embeddings for uncached items
            images_to_generate = [request.images[i] for i in uncached_indices]
            
            if images_to_generate:
                logger.info(f"Batch cache miss for {len(images_to_generate)} images, generating...")
                new_embeddings, _ = await batch_processor.process_image_batch(images_to_generate)
                cache.put_batch(images_to_generate, new_embeddings)
            else:
                logger.info("All embeddings found in batch cache")
                new_embeddings = []
            
            # Reconstruct full embedding list in original order
            final_embeddings = []
            new_embedding_idx = 0
            for i in range(len(request.images)):
                if cached_embeddings[i] is not None:
                    final_embeddings.append(cached_embeddings[i])
                else:
                    final_embeddings.append(new_embeddings[new_embedding_idx])
                    new_embedding_idx += 1
        else:
            # Skip cache and generate directly
            final_embeddings, _ = await batch_processor.process_image_batch(request.images)
        
        logger.info(f"Batch embedding complete: {cached_count} cached, {len(request.images) - cached_count} generated")
        
        return {
            "embeddings": final_embeddings,
            "count": len(final_embeddings),
            "dimension": len(final_embeddings[0]) if final_embeddings else 0,
            "cached_count": cached_count,
            "generated_count": len(request.images) - cached_count,
        }
    except Exception as e:
        logger.error(f"Batch image embedding failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate batch embeddings: {str(e)}")
