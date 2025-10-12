"""
Image embedding generation using CLIP
"""
import base64
import io
import torch
from typing import List
from PIL import Image
from app.core.models import get_image_model
from app.core.config import settings


def decode_base64_image(base64_str: str) -> Image.Image:
    """
    Decode base64 string to PIL Image
    
    Args:
        base64_str: Base64 encoded image string
        
    Returns:
        PIL Image
    """
    # Remove data URL prefix if present
    if ',' in base64_str:
        base64_str = base64_str.split(',', 1)[1]
    
    # Decode base64
    image_bytes = base64.b64decode(base64_str)
    
    # Open as PIL Image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    return image


async def generate_image_embeddings(images: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of images
    
    Args:
        images: List of base64 encoded image strings
        
    Returns:
        List of embedding vectors (normalized)
    """
    if not images:
        return []
    
    model, processor = get_image_model()
    device = torch.device(settings.DEVICE)
    
    # Decode base64 images to PIL
    pil_images = []
    for img_str in images:
        try:
            img = decode_base64_image(img_str)
            pil_images.append(img)
        except Exception as e:
            raise ValueError(f"Failed to decode image: {str(e)}")
    
    # Process images
    inputs = processor(
        images=pil_images,
        return_tensors="pt",
        padding=True
    ).to(device)
    
    # Generate embeddings
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
    
    # Normalize embeddings
    image_features = torch.nn.functional.normalize(image_features, p=2, dim=1)
    
    # Convert to list
    embeddings_list = image_features.cpu().numpy().tolist()
    
    return embeddings_list


async def generate_image_embedding(image: str) -> List[float]:
    """
    Generate embedding for a single image
    
    Args:
        image: Base64 encoded image string
        
    Returns:
        Embedding vector (normalized)
    """
    embeddings = await generate_image_embeddings([image])
    return embeddings[0]

