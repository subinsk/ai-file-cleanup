"""ML Service Client"""
import logging
import httpx
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)


class MLServiceClient:
    """Client for ML inference service"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or settings.ML_SERVICE_URL
        self.timeout = settings.ML_SERVICE_TIMEOUT
    
    async def generate_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate text embeddings"""
        if not texts:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/embeddings/text",
                    json={"texts": texts}
                )
                response.raise_for_status()
                data = response.json()
                return data["embeddings"]
                
        except Exception as e:
            logger.error(f"ML service error: {e}")
            raise Exception(f"Failed to generate text embeddings: {str(e)}")
    
    async def generate_image_embeddings(self, images: List[str]) -> List[List[float]]:
        """Generate image embeddings"""
        if not images:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/embeddings/image",
                    json={"images": images}
                )
                response.raise_for_status()
                data = response.json()
                return data["embeddings"]
                
        except Exception as e:
            logger.error(f"ML service error: {e}")
            raise Exception(f"Failed to generate image embeddings: {str(e)}")
    
    async def health_check(self) -> bool:
        """Check if ML service is healthy"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False


ml_client = MLServiceClient()
