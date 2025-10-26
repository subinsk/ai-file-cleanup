"""
Image processing and normalization service
"""
import logging
import io
import base64
from typing import Optional, Dict, Any, Tuple
from PIL import Image, ImageOps
import numpy as np

# Try to import OpenCV, but make it optional
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    cv2 = None

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Service for processing and normalizing images"""
    
    def __init__(self):
        self.max_size = (1024, 1024)  # Maximum image size
        self.min_size = (32, 32)  # Minimum image size
        self.supported_formats = ['JPEG', 'PNG', 'WEBP', 'BMP', 'TIFF']
    
    async def process_image(self, image_data: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Process and normalize an image
        
        Args:
            image_data: Image file bytes
            mime_type: MIME type of the image
            
        Returns:
            Dictionary with processed image data and metadata
        """
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get original metadata
            original_size = image.size
            original_format = image.format
            
            # Normalize image
            normalized_image = self._normalize_image(image)
            
            # Generate perceptual hash
            phash = self._generate_perceptual_hash(normalized_image)
            
            # Create base64 representation for ML processing
            img_buffer = io.BytesIO()
            normalized_image.save(img_buffer, format='JPEG', quality=85)
            img_buffer.seek(0)
            base64_image = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
            # Calculate image features
            features = self._extract_image_features(normalized_image)
            
            result = {
                'base64_image': base64_image,
                'perceptual_hash': phash,
                'features': features,
                'metadata': {
                    'original_size': original_size,
                    'original_format': original_format,
                    'normalized_size': normalized_image.size,
                    'file_size': len(image_data),
                    'mime_type': mime_type
                },
                'success': True,
                'error': None
            }
            
            logger.info(f"Image processed successfully: {original_size} -> {normalized_image.size}")
            return result
            
        except Exception as e:
            logger.error(f"Image processing failed: {e}", exc_info=True)
            return {
                'base64_image': '',
                'perceptual_hash': '',
                'features': {},
                'metadata': {},
                'success': False,
                'error': str(e)
            }
    
    def _normalize_image(self, image: Image.Image) -> Image.Image:
        """
        Normalize image for consistent processing
        
        Args:
            image: PIL Image object
            
        Returns:
            Normalized PIL Image
        """
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Auto-orient based on EXIF data
        image = ImageOps.exif_transpose(image)
        
        # Resize if too large
        if image.size[0] > self.max_size[0] or image.size[1] > self.max_size[1]:
            image.thumbnail(self.max_size, Image.Resampling.LANCZOS)
        
        # Skip if too small
        if image.size[0] < self.min_size[0] or image.size[1] < self.min_size[1]:
            image = image.resize(self.min_size, Image.Resampling.LANCZOS)
        
        # Use OpenCV for advanced normalization if available
        if OPENCV_AVAILABLE:
            try:
                # Convert PIL to OpenCV format
                cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                
                # Apply histogram equalization for better contrast
                if len(cv_image.shape) == 3:
                    # Color image
                    yuv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2YUV)
                    yuv[:,:,0] = cv2.equalizeHist(yuv[:,:,0])
                    cv_image = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
                else:
                    # Grayscale image
                    cv_image = cv2.equalizeHist(cv_image)
                
                # Convert back to PIL
                image = Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))
                
            except Exception as e:
                logger.warning(f"OpenCV normalization failed, using PIL fallback: {e}")
                # Fallback to PIL normalization
                image = ImageOps.autocontrast(image, cutoff=1)
        else:
            logger.info("OpenCV not available, using PIL for image normalization")
            # Use PIL normalization
            image = ImageOps.autocontrast(image, cutoff=1)
        
        return image
    
    def _generate_perceptual_hash(self, image: Image.Image) -> str:
        """
        Generate perceptual hash for image similarity
        
        Args:
            image: PIL Image object
            
        Returns:
            Perceptual hash string
        """
        try:
            # Resize to 8x8 for hash calculation
            hash_size = 8
            resized = image.resize((hash_size, hash_size), Image.Resampling.LANCZOS)
            
            # Convert to grayscale
            gray = resized.convert('L')
            
            # Calculate average pixel value
            pixels = list(gray.getdata())
            avg = sum(pixels) / len(pixels)
            
            # Generate hash by comparing each pixel to average
            hash_bits = []
            for pixel in pixels:
                hash_bits.append('1' if pixel > avg else '0')
            
            # Convert to hex
            hash_string = ''.join(hash_bits)
            hex_hash = hex(int(hash_string, 2))[2:].zfill(16)
            
            return hex_hash
            
        except Exception as e:
            logger.error(f"Perceptual hash generation failed: {e}")
            return ''
    
    def _extract_image_features(self, image: Image.Image) -> Dict[str, Any]:
        """
        Extract basic image features
        
        Args:
            image: PIL Image object
            
        Returns:
            Dictionary of image features
        """
        try:
            # Convert to numpy array
            img_array = np.array(image)
            
            # Calculate basic statistics
            mean_color = np.mean(img_array, axis=(0, 1))
            std_color = np.std(img_array, axis=(0, 1))
            
            # Calculate brightness
            gray = np.mean(img_array, axis=2)
            brightness = np.mean(gray)
            
            # Calculate contrast
            contrast = np.std(gray)
            
            # Calculate aspect ratio
            aspect_ratio = image.size[0] / image.size[1]
            
            features = {
                'mean_color': mean_color.tolist(),
                'std_color': std_color.tolist(),
                'brightness': float(brightness),
                'contrast': float(contrast),
                'aspect_ratio': float(aspect_ratio),
                'dominant_colors': self._get_dominant_colors(img_array)
            }
            
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return {}
    
    def _get_dominant_colors(self, img_array: np.ndarray, num_colors: int = 5) -> list:
        """
        Get dominant colors in the image
        
        Args:
            img_array: Image as numpy array
            num_colors: Number of dominant colors to extract
            
        Returns:
            List of dominant colors
        """
        try:
            # Reshape image to 2D array of pixels
            pixels = img_array.reshape(-1, 3)
            
            # Sample pixels for performance
            if len(pixels) > 10000:
                indices = np.random.choice(len(pixels), 10000, replace=False)
                pixels = pixels[indices]
            
            # Simple k-means-like approach
            # For simplicity, we'll use a basic clustering approach
            # In production, you might want to use sklearn.cluster.KMeans
            
            # Group similar colors
            color_groups = {}
            for pixel in pixels:
                # Quantize colors to reduce noise
                quantized = tuple((pixel // 32) * 32)
                if quantized not in color_groups:
                    color_groups[quantized] = []
                color_groups[quantized].append(pixel)
            
            # Get most frequent colors
            sorted_colors = sorted(color_groups.items(), key=lambda x: len(x[1]), reverse=True)
            dominant_colors = [list(color[0]) for color in sorted_colors[:num_colors]]
            
            return dominant_colors
            
        except Exception as e:
            logger.error(f"Dominant color extraction failed: {e}")
            return []
    
    async def process_image_from_base64(self, base64_data: str, mime_type: str) -> Dict[str, Any]:
        """
        Process image from base64-encoded data
        
        Args:
            base64_data: Base64-encoded image data
            mime_type: MIME type of the image
            
        Returns:
            Dictionary with processed image data and metadata
        """
        try:
            # Decode base64 data
            image_data = base64.b64decode(base64_data)
            return await self.process_image(image_data, mime_type)
            
        except Exception as e:
            logger.error(f"Base64 image processing failed: {e}", exc_info=True)
            return {
                'base64_image': '',
                'perceptual_hash': '',
                'features': {},
                'metadata': {},
                'success': False,
                'error': f"Base64 decoding failed: {str(e)}"
            }
    
    def calculate_image_similarity(self, hash1: str, hash2: str) -> float:
        """
        Calculate similarity between two perceptual hashes
        
        Args:
            hash1: First perceptual hash
            hash2: Second perceptual hash
            
        Returns:
            Similarity score (0-1)
        """
        if not hash1 or not hash2 or len(hash1) != len(hash2):
            return 0.0
        
        try:
            # Calculate Hamming distance
            distance = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
            max_distance = len(hash1)
            
            # Convert to similarity (0-1)
            similarity = 1.0 - (distance / max_distance)
            return similarity
            
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
            return 0.0


# Global instance
image_processor = ImageProcessor()
