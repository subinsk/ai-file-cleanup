"""
Embedding generation endpoints
"""
import logging
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.text_embeddings import generate_text_embeddings
from app.services.image_embeddings import generate_image_embeddings
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


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
    Generate embeddings for text
    
    **Request:**
    - texts: List of text strings (1-32 items)
    
    **Response:**
    - embeddings: List of embedding vectors
    - count: Number of embeddings
    - dimension: Embedding dimension (384 for MiniLM)
    """
    try:
        logger.info(f"Generating embeddings for {len(request.texts)} texts")
        
        embeddings = await generate_text_embeddings(request.texts)
        
        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0,
        }
    except Exception as e:
        logger.error(f"Text embedding failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")


@router.post("/image", response_model=EmbeddingResponse)
async def embed_image(request: ImageEmbeddingRequest):
    """
    Generate embeddings for images
    
    **Request:**
    - images: List of base64 encoded images (1-32 items)
    
    **Response:**
    - embeddings: List of embedding vectors
    - count: Number of embeddings
    - dimension: Embedding dimension (512 for CLIP)
    """
    try:
        logger.info(f"Generating embeddings for {len(request.images)} images")
        
        embeddings = await generate_image_embeddings(request.images)
        
        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0,
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

