"""
ML model loading and management
"""
import logging
import torch
from transformers import AutoModel, AutoTokenizer, CLIPProcessor, CLIPModel
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global model instances
text_model = None
text_tokenizer = None
image_model = None
image_processor = None


async def load_models():
    """
    Load all ML models into memory
    """
    global text_model, text_tokenizer, image_model, image_processor
    
    # Set device
    device = torch.device(settings.DEVICE)
    logger.info(f"🔧 Using device: {device}")
    
    # Load text embedding model
    logger.info(f"📥 Loading text model: {settings.TEXT_MODEL_NAME}")
    text_tokenizer = AutoTokenizer.from_pretrained(
        settings.TEXT_MODEL_NAME,
        cache_dir=settings.MODEL_CACHE_DIR
    )
    text_model = AutoModel.from_pretrained(
        settings.TEXT_MODEL_NAME,
        cache_dir=settings.MODEL_CACHE_DIR
    ).to(device)
    text_model.eval()  # Set to evaluation mode
    logger.info("✅ Text model loaded")
    
    # Load image embedding model (CLIP)
    logger.info(f"📥 Loading image model: {settings.IMAGE_MODEL_NAME}")
    image_processor = CLIPProcessor.from_pretrained(
        settings.IMAGE_MODEL_NAME,
        cache_dir=settings.MODEL_CACHE_DIR
    )
    image_model = CLIPModel.from_pretrained(
        settings.IMAGE_MODEL_NAME,
        cache_dir=settings.MODEL_CACHE_DIR
    ).to(device)
    image_model.eval()  # Set to evaluation mode
    logger.info("✅ Image model loaded")
    
    # Log memory usage
    if torch.cuda.is_available():
        logger.info(f"📊 GPU Memory: {torch.cuda.memory_allocated() / 1024**2:.2f}MB")
    else:
        logger.info("📊 Running on CPU")


def get_text_model():
    """Get text embedding model"""
    if text_model is None or text_tokenizer is None:
        raise RuntimeError("Text model not loaded. Call load_models() first.")
    return text_model, text_tokenizer


def get_image_model():
    """Get image embedding model"""
    if image_model is None or image_processor is None:
        raise RuntimeError("Image model not loaded. Call load_models() first.")
    return image_model, image_processor


def are_models_loaded() -> bool:
    """Check if models are loaded"""
    return all([text_model, text_tokenizer, image_model, image_processor])

