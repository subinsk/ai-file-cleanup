-- Optimize pgvector indexes for better query performance
-- This migration adds HNSW indexes which are faster than IVFFlat for similarity search

-- Drop existing IVFFlat indexes if they exist
DROP INDEX IF EXISTS file_embeddings_embedding_idx;
DROP INDEX IF EXISTS file_embeddings_embedding_img_idx;

-- Create HNSW indexes for better performance (PostgreSQL 12+)
-- HNSW is faster for similarity search but uses more memory
-- m = 16 (connections per layer), ef_construction = 64 (search width during construction)
CREATE INDEX IF NOT EXISTS file_embeddings_embedding_hnsw_idx 
ON file_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS file_embeddings_embedding_img_hnsw_idx 
ON file_embeddings 
USING hnsw (embedding_img vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add index on kind for faster filtering
CREATE INDEX IF NOT EXISTS file_embeddings_kind_idx ON file_embeddings(kind);

-- Add composite index for kind + embedding queries
CREATE INDEX IF NOT EXISTS file_embeddings_kind_text_idx 
ON file_embeddings(kind) 
WHERE kind = 'text' AND embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS file_embeddings_kind_image_idx 
ON file_embeddings(kind) 
WHERE kind = 'image' AND embedding_img IS NOT NULL;

