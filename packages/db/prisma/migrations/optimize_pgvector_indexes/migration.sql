-- Add pgvector indexes for efficient similarity search
-- This migration optimizes pgvector queries with proper index tuning

-- Create IVFFLAT index for text embeddings (768-dimensional)
-- IVFFLAT is good for approximate search with reasonable recall
CREATE INDEX IF NOT EXISTS "idx_file_embeddings_text_embedding_ivfflat"
ON "file_embeddings" USING ivfflat ("embedding" vector_cosine_ops)
WHERE embedding IS NOT NULL
WITH (lists = 100);

-- Create IVFFLAT index for image embeddings (512-dimensional)
-- Adjust lists parameter based on dataset size
CREATE INDEX IF NOT EXISTS "idx_file_embeddings_image_embedding_ivfflat"
ON "file_embeddings" USING ivfflat ("embedding_img" vector_cosine_ops)
WHERE embedding_img IS NOT NULL
WITH (lists = 50);

-- Add composite index for efficient file lookup with upload context
CREATE INDEX IF NOT EXISTS "idx_files_upload_id_sha256"
ON "files" ("upload_id", "sha256")
WHERE sha256 IS NOT NULL;

-- Add index for file type queries
CREATE INDEX IF NOT EXISTS "idx_files_mime_type"
ON "files" ("mime_type")
WHERE mime_type IS NOT NULL;

-- Add index for created_at queries (temporal filtering)
CREATE INDEX IF NOT EXISTS "idx_file_embeddings_created_at"
ON "file_embeddings" ("kind")
WHERE "kind" IN ('text', 'image');

-- Add partitioning hint (requires manual partitioning for large datasets)
-- COMMENT ON INDEX "idx_file_embeddings_text_embedding_ivfflat" 
-- IS 'IVFFLAT index for text embeddings - set application.settings.vector_search_limit <= 1000';
