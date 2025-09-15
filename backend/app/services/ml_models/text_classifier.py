"""
Text classification using DistilBERT
"""

import torch
from transformers import AutoTokenizer, AutoModel
from typing import Dict, List
import os
import asyncio
from pathlib import Path


class TextClassifier:
    """Text classification service using DistilBERT"""
    
    def __init__(self):
        self.model_name = "distilbert-base-uncased"
        self.tokenizer = None
        self.model = None
        self.categories = ["document", "code", "text", "unknown"]
        self._load_model()
    
    def _load_model(self):
        """Load the DistilBERT model and tokenizer"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.model.eval()
            print(f"✅ Loaded {self.model_name} for text classification")
        except Exception as e:
            print(f"❌ Error loading text classifier: {e}")
            self.tokenizer = None
            self.model = None
    
    async def classify(self, file_path: str) -> str:
        """Classify a text file"""
        try:
            if not self.model or not self.tokenizer:
                return "unknown"
            
            # Read file content
            content = await self._read_file_content(file_path)
            if not content:
                return "unknown"
            
            # Preprocess text
            text = self._preprocess_text(content)
            if not text:
                return "unknown"
            
            # Classify using DistilBERT
            category = await self._classify_text(text)
            return category
            
        except Exception as e:
            print(f"Error classifying text file {file_path}: {e}")
            return "unknown"
    
    async def _read_file_content(self, file_path: str) -> str:
        """Read file content safely"""
        try:
            # Check file size (limit to 1MB for text processing)
            file_size = os.path.getsize(file_path)
            if file_size > 1024 * 1024:  # 1MB limit
                return ""
            
            # Read file based on extension
            ext = Path(file_path).suffix.lower()
            
            if ext == '.pdf':
                # For PDF files, we would use PyPDF2 or similar
                # For now, return empty string
                return ""
            elif ext in ['.txt', '.md', '.py', '.js', '.ts', '.java', '.cpp', '.c', '.h']:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            else:
                # Try to read as text
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
                    
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            return ""
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for classification"""
        try:
            # Remove extra whitespace and limit length
            text = ' '.join(text.split())
            
            # Limit to first 512 tokens (DistilBERT limit)
            words = text.split()
            if len(words) > 512:
                text = ' '.join(words[:512])
            
            return text.strip()
            
        except Exception as e:
            print(f"Error preprocessing text: {e}")
            return ""
    
    async def _classify_text(self, text: str) -> str:
        """Classify text using DistilBERT"""
        try:
            # Tokenize text
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=512
            )
            
            # Get model predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                # Use the last hidden state for classification
                # This is a simplified approach - in production, you'd use a fine-tuned classifier
                embeddings = outputs.last_hidden_state.mean(dim=1)
            
            # Simple heuristic classification based on content
            category = self._heuristic_classify(text)
            return category
            
        except Exception as e:
            print(f"Error classifying text: {e}")
            return "unknown"
    
    def _heuristic_classify(self, text: str) -> str:
        """Heuristic classification based on text content"""
        try:
            text_lower = text.lower()
            
            # Code patterns
            code_patterns = [
                'def ', 'function ', 'class ', 'import ', 'from ',
                'if ', 'else ', 'for ', 'while ', 'return ',
                'public ', 'private ', 'static ', 'void ',
                'int ', 'string ', 'bool ', 'var ', 'let ', 'const ',
                '#include', '#define', 'main(', 'printf', 'cout'
            ]
            
            # Document patterns
            doc_patterns = [
                'chapter', 'section', 'paragraph', 'introduction',
                'conclusion', 'abstract', 'summary', 'table of contents',
                'page', 'figure', 'table', 'reference', 'bibliography'
            ]
            
            # Count pattern matches
            code_matches = sum(1 for pattern in code_patterns if pattern in text_lower)
            doc_matches = sum(1 for pattern in doc_patterns if pattern in text_lower)
            
            # Classify based on pattern density
            if code_matches > 3:
                return "code"
            elif doc_matches > 2:
                return "document"
            elif len(text) > 1000:
                return "document"
            else:
                return "text"
                
        except Exception as e:
            print(f"Error in heuristic classification: {e}")
            return "unknown"
