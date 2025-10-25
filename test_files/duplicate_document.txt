AI File Cleanup System - Test Document

This is a comprehensive test document for the AI-powered file deduplication system. 
The system uses advanced machine learning algorithms to identify duplicate files 
based on content similarity rather than just file names or sizes.

Key Features:
- Text similarity detection using DistilBERT embeddings
- Image similarity detection using CLIP embeddings  
- PDF text extraction and analysis
- Perceptual hashing for exact duplicates
- Cosine similarity clustering
- Interactive web and desktop interfaces

The system can identify duplicates even when files have different names, 
are stored in different formats, or have been slightly modified.

Technical Implementation:
- Backend: Python FastAPI with PostgreSQL + pgvector
- ML Service: PyTorch with Hugging Face transformers
- Frontend: React with Next.js and Electron
- Database: Neon PostgreSQL with vector extensions

This document serves as a test case for the deduplication algorithms.
