"""
Unified file processing service
"""
import logging
import hashlib
from typing import Dict, Any, Optional
from .pdf_processor import pdf_processor
from .image_processor import image_processor

logger = logging.getLogger(__name__)


class FileProcessor:
    """Unified service for processing different file types"""
    
    def __init__(self):
        self.supported_image_types = {
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/bmp', 'image/tiff'
        }
        self.supported_text_types = {
            'text/plain', 'text/csv', 'text/html', 'text/xml'
        }
        self.supported_pdf_types = {
            'application/pdf'
        }
    
    async def process_file(self, file_data: bytes, filename: str, mime_type: str) -> Dict[str, Any]:
        """
        Process a file based on its type
        
        Args:
            file_data: File bytes
            filename: Original filename
            mime_type: MIME type of the file
            
        Returns:
            Dictionary with processing results
        """
        try:
            # Calculate file hash
            file_hash = self._calculate_sha256(file_data)
            
            # Determine file type and process accordingly
            if mime_type in self.supported_pdf_types:
                return await self._process_pdf(file_data, filename, mime_type, file_hash)
            elif mime_type in self.supported_image_types:
                return await self._process_image(file_data, filename, mime_type, file_hash)
            elif mime_type in self.supported_text_types:
                return await self._process_text(file_data, filename, mime_type, file_hash)
            else:
                return self._process_unsupported(filename, mime_type, file_hash)
                
        except Exception as e:
            logger.error(f"File processing failed for {filename}: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'file_hash': self._calculate_sha256(file_data),
                'filename': filename,
                'mime_type': mime_type
            }
    
    async def _process_pdf(self, file_data: bytes, filename: str, mime_type: str, file_hash: str) -> Dict[str, Any]:
        """Process PDF file"""
        try:
            # Extract text from PDF
            pdf_result = await pdf_processor.extract_text(file_data)
            
            if not pdf_result['success']:
                return {
                    'success': False,
                    'error': pdf_result['error'],
                    'file_hash': file_hash,
                    'filename': filename,
                    'mime_type': mime_type,
                    'file_type': 'pdf'
                }
            
            # Get text excerpt for preview
            text_excerpt = pdf_processor.get_text_excerpt(pdf_result['text'])
            
            return {
                'success': True,
                'file_hash': file_hash,
                'filename': filename,
                'mime_type': mime_type,
                'file_type': 'pdf',
                'text_content': pdf_result['text'],
                'text_excerpt': text_excerpt,
                'metadata': pdf_result['metadata'],
                'processing_info': {
                    'extracted_text': True,
                    'text_length': len(pdf_result['text']),
                    'num_pages': pdf_result['metadata'].get('num_pages', 0)
                }
            }
            
        except Exception as e:
            logger.error(f"PDF processing failed for {filename}: {e}")
            return {
                'success': False,
                'error': f"PDF processing failed: {str(e)}",
                'file_hash': file_hash,
                'filename': filename,
                'mime_type': mime_type,
                'file_type': 'pdf'
            }
    
    async def _process_image(self, file_data: bytes, filename: str, mime_type: str, file_hash: str) -> Dict[str, Any]:
        """Process image file"""
        try:
            # Process image
            image_result = await image_processor.process_image(file_data, mime_type)
            
            if not image_result['success']:
                return {
                    'success': False,
                    'error': image_result['error'],
                    'file_hash': file_hash,
                    'filename': filename,
                    'mime_type': mime_type,
                    'file_type': 'image'
                }
            
            # Extract resolution from metadata for tie-breaker logic
            resolution = None
            if 'original_size' in image_result['metadata']:
                orig_size = image_result['metadata']['original_size']
                if isinstance(orig_size, (list, tuple)) and len(orig_size) == 2:
                    resolution = {'width': orig_size[0], 'height': orig_size[1]}
            
            result = {
                'success': True,
                'file_hash': file_hash,
                'filename': filename,
                'mime_type': mime_type,
                'file_type': 'image',
                'perceptual_hash': image_result['perceptual_hash'],
                'base64_image': image_result['base64_image'],
                'image_features': image_result['features'],
                'metadata': image_result['metadata'],
                'processing_info': {
                    'normalized': True,
                    'perceptual_hash': True,
                    'features_extracted': True
                }
            }
            
            # Add resolution for tie-breaker logic
            if resolution:
                result['resolution'] = resolution
            
            return result
            
        except Exception as e:
            logger.error(f"Image processing failed for {filename}: {e}")
            return {
                'success': False,
                'error': f"Image processing failed: {str(e)}",
                'file_hash': file_hash,
                'filename': filename,
                'mime_type': mime_type,
                'file_type': 'image'
            }
    
    async def _process_text(self, file_data: bytes, filename: str, mime_type: str, file_hash: str) -> Dict[str, Any]:
        """Process text file"""
        try:
            # Decode text content
            text_content = file_data.decode('utf-8', errors='ignore')
            
            # Clean text
            cleaned_text = self._clean_text(text_content)
            
            # Get excerpt
            text_excerpt = self._get_text_excerpt(cleaned_text)
            
            return {
                'success': True,
                'file_hash': file_hash,
                'filename': filename,
                'mime_type': mime_type,
                'file_type': 'text',
                'text_content': cleaned_text,
                'text_excerpt': text_excerpt,
                'metadata': {
                    'original_length': len(text_content),
                    'cleaned_length': len(cleaned_text)
                },
                'processing_info': {
                    'text_extracted': True,
                    'text_length': len(cleaned_text)
                }
            }
            
        except Exception as e:
            logger.error(f"Text processing failed for {filename}: {e}")
            return {
                'success': False,
                'error': f"Text processing failed: {str(e)}",
                'file_hash': file_hash,
                'filename': filename,
                'mime_type': mime_type,
                'file_type': 'text'
            }
    
    def _process_unsupported(self, filename: str, mime_type: str, file_hash: str) -> Dict[str, Any]:
        """Handle unsupported file types"""
        return {
            'success': True,
            'file_hash': file_hash,
            'filename': filename,
            'mime_type': mime_type,
            'file_type': 'unsupported',
            'text_content': '',
            'text_excerpt': '',
            'metadata': {},
            'processing_info': {
                'supported': False,
                'reason': f'Unsupported file type: {mime_type}'
            }
        }
    
    def _calculate_sha256(self, data: bytes) -> str:
        """Calculate SHA-256 hash of file data"""
        return hashlib.sha256(data).hexdigest()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ''
        
        import re
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters that might interfere with embeddings
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', ' ', text)
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def _get_text_excerpt(self, text: str, max_length: int = 500) -> str:
        """Get text excerpt for preview"""
        if not text:
            return ''
        
        if len(text) <= max_length:
            return text
        
        # Find a good break point
        excerpt = text[:max_length]
        last_period = excerpt.rfind('.')
        last_exclamation = excerpt.rfind('!')
        last_question = excerpt.rfind('?')
        
        last_ending = max(last_period, last_exclamation, last_question)
        
        if last_ending > max_length * 0.7:
            return text[:last_ending + 1]
        
        return text[:max_length] + "..."
    
    def get_file_type_category(self, mime_type: str) -> str:
        """Get file type category for processing"""
        if mime_type in self.supported_pdf_types:
            return 'pdf'
        elif mime_type in self.supported_image_types:
            return 'image'
        elif mime_type in self.supported_text_types:
            return 'text'
        else:
            return 'unsupported'


# Global instance
file_processor = FileProcessor()
