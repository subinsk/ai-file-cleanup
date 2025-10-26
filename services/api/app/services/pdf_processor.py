"""
PDF text extraction service
"""
import logging
import io
from typing import Optional, Dict, Any
import PyPDF2
from PIL import Image
import base64

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Service for extracting text from PDF files"""
    
    def __init__(self):
        self.max_pages = 10  # Limit pages to process for performance
        self.max_text_length = 10000  # Limit extracted text length
    
    async def extract_text(self, pdf_data: bytes) -> Dict[str, Any]:
        """
        Extract text content from PDF file
        
        Args:
            pdf_data: PDF file bytes
            
        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            # Create a file-like object from bytes
            pdf_buffer = io.BytesIO(pdf_data)
            
            # Create PDF reader
            pdf_reader = PyPDF2.PdfReader(pdf_buffer)
            
            # Extract text from all pages
            text_parts = []
            num_pages = len(pdf_reader.pages)
            
            for page_num in range(min(num_pages, self.max_pages)):
                try:
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {page_num + 1}: {e}")
                    continue
            
            # Combine all text
            text = '\n'.join(text_parts)
            
            # Get metadata
            metadata = {
                'num_pages': num_pages,
                'info': pdf_reader.metadata if pdf_reader.metadata else {},
                'text_length': len(text)
            }
            
            # Limit text length for processing
            if len(text) > self.max_text_length:
                text = text[:self.max_text_length] + "... [truncated]"
                logger.warning(f"PDF text truncated to {self.max_text_length} characters")
            
            # Clean and normalize text
            cleaned_text = self._clean_text(text)
            
            result = {
                'text': cleaned_text,
                'metadata': metadata,
                'success': True,
                'error': None
            }
            
            logger.info(f"PDF processed successfully: {metadata['num_pages']} pages, {metadata['text_length']} chars")
            return result
            
        except Exception as e:
            logger.error(f"PDF processing failed: {e}", exc_info=True)
            return {
                'text': '',
                'metadata': {},
                'success': False,
                'error': str(e)
            }
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ''
        
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might interfere with embeddings
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', ' ', text)
        
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    async def extract_text_from_base64(self, base64_data: str) -> Dict[str, Any]:
        """
        Extract text from base64-encoded PDF
        
        Args:
            base64_data: Base64-encoded PDF data
            
        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            # Decode base64 data
            pdf_data = base64.b64decode(base64_data)
            return await self.extract_text(pdf_data)
            
        except Exception as e:
            logger.error(f"Base64 PDF processing failed: {e}", exc_info=True)
            return {
                'text': '',
                'metadata': {},
                'success': False,
                'error': f"Base64 decoding failed: {str(e)}"
            }
    
    def get_text_excerpt(self, text: str, max_length: int = 500) -> str:
        """
        Get a text excerpt for preview purposes
        
        Args:
            text: Full text content
            max_length: Maximum length of excerpt
            
        Returns:
            Text excerpt
        """
        if not text:
            return ''
        
        if len(text) <= max_length:
            return text
        
        # Find a good break point (end of sentence)
        excerpt = text[:max_length]
        last_period = excerpt.rfind('.')
        last_exclamation = excerpt.rfind('!')
        last_question = excerpt.rfind('?')
        
        # Use the last sentence ending found
        last_ending = max(last_period, last_exclamation, last_question)
        
        if last_ending > max_length * 0.7:  # If we found a good break point
            return text[:last_ending + 1]
        
        # Otherwise, just truncate
        return text[:max_length] + "..."


# Global instance
pdf_processor = PDFProcessor()
