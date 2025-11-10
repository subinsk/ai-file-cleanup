"""
Batch inference service for efficient embedding generation
Optimizes GPU memory usage and processing time for large batches
"""
import logging
import asyncio
from typing import List, Optional, Tuple
from app.core.config import settings
from app.services.text_embeddings import generate_text_embeddings
from app.services.image_embeddings import generate_image_embeddings

logger = logging.getLogger(__name__)


class BatchProcessor:
    """
    Efficient batch processing for embeddings
    - Splits large batches into GPU-friendly chunks
    - Manages memory efficiently
    - Provides progress tracking
    """
    
    def __init__(self, max_batch_size: int = settings.MAX_BATCH_SIZE):
        self.max_batch_size = max_batch_size
        self.optimal_chunk_size = min(max_batch_size, 32)  # Empirically optimal for most GPUs
    
    async def process_text_batch(
        self, 
        texts: List[str],
        progress_callback: Optional[callable] = None
    ) -> Tuple[List[List[float]], dict]:
        """
        Process batch of texts with progress tracking
        
        Args:
            texts: List of text strings
            progress_callback: Optional callback for progress updates
            
        Returns:
            Tuple of (embeddings, stats)
        """
        if not texts:
            return [], {"total": 0, "processed": 0, "time_ms": 0}
        
        total = len(texts)
        processed = 0
        all_embeddings = []
        chunk_count = (total + self.optimal_chunk_size - 1) // self.optimal_chunk_size
        
        logger.info(f"Processing {total} texts in {chunk_count} chunks")
        
        # Process in chunks
        for chunk_idx in range(0, total, self.optimal_chunk_size):
            chunk = texts[chunk_idx:chunk_idx + self.optimal_chunk_size]
            chunk_embeddings = await generate_text_embeddings(chunk)
            all_embeddings.extend(chunk_embeddings)
            
            processed += len(chunk)
            
            # Call progress callback
            if progress_callback:
                progress = (processed / total) * 100
                await progress_callback({
                    'current': processed,
                    'total': total,
                    'progress_percent': progress,
                    'chunk': chunk_idx // self.optimal_chunk_size + 1,
                    'total_chunks': chunk_count
                })
            
            logger.debug(f"Processed chunk {chunk_idx // self.optimal_chunk_size + 1}/{chunk_count}")
            
            # Yield to event loop to prevent blocking
            await asyncio.sleep(0)
        
        return all_embeddings, {
            'total': total,
            'processed': processed,
            'chunks': chunk_count,
            'chunk_size': self.optimal_chunk_size
        }
    
    async def process_image_batch(
        self, 
        images: List[str],
        progress_callback: Optional[callable] = None
    ) -> Tuple[List[List[float]], dict]:
        """
        Process batch of images with progress tracking
        
        Args:
            images: List of base64 encoded images
            progress_callback: Optional callback for progress updates
            
        Returns:
            Tuple of (embeddings, stats)
        """
        if not images:
            return [], {"total": 0, "processed": 0, "time_ms": 0}
        
        total = len(images)
        processed = 0
        all_embeddings = []
        # Image processing is more memory intensive, use smaller chunks
        image_chunk_size = min(self.optimal_chunk_size // 2, 16)
        chunk_count = (total + image_chunk_size - 1) // image_chunk_size
        
        logger.info(f"Processing {total} images in {chunk_count} chunks")
        
        # Process in chunks
        for chunk_idx in range(0, total, image_chunk_size):
            chunk = images[chunk_idx:chunk_idx + image_chunk_size]
            chunk_embeddings = await generate_image_embeddings(chunk)
            all_embeddings.extend(chunk_embeddings)
            
            processed += len(chunk)
            
            # Call progress callback
            if progress_callback:
                progress = (processed / total) * 100
                await progress_callback({
                    'current': processed,
                    'total': total,
                    'progress_percent': progress,
                    'chunk': chunk_idx // image_chunk_size + 1,
                    'total_chunks': chunk_count
                })
            
            logger.debug(f"Processed image chunk {chunk_idx // image_chunk_size + 1}/{chunk_count}")
            
            # Yield to event loop to prevent blocking
            await asyncio.sleep(0)
        
        return all_embeddings, {
            'total': total,
            'processed': processed,
            'chunks': chunk_count,
            'chunk_size': image_chunk_size
        }
    
    async def process_mixed_batch(
        self,
        texts: Optional[List[str]] = None,
        images: Optional[List[str]] = None,
        progress_callback: Optional[callable] = None
    ) -> Tuple[List[List[float]], List[List[float]], dict]:
        """
        Process batch of both texts and images
        
        Args:
            texts: Optional list of text strings
            images: Optional list of base64 images
            progress_callback: Optional callback for progress updates
            
        Returns:
            Tuple of (text_embeddings, image_embeddings, stats)
        """
        text_embeddings = []
        image_embeddings = []
        stats = {'texts_processed': 0, 'images_processed': 0}
        
        # Process texts
        if texts:
            text_embeddings, text_stats = await self.process_text_batch(
                texts,
                progress_callback
            )
            stats.update({'text_stats': text_stats})
        
        # Process images
        if images:
            image_embeddings, image_stats = await self.process_image_batch(
                images,
                progress_callback
            )
            stats.update({'image_stats': image_stats})
        
        return text_embeddings, image_embeddings, stats


# Global batch processor instance
_batch_processor = BatchProcessor()


def get_batch_processor() -> BatchProcessor:
    """Get global batch processor instance"""
    return _batch_processor
