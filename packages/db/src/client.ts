import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton
 * Prevents multiple instances in development with hot reloading
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Health check for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Enable pgvector extension (run once on setup)
 */
export async function enablePgVector(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('pgvector extension enabled');
  } catch (error) {
    console.error('Failed to enable pgvector:', error);
    throw error;
  }
}

/**
 * Create optimized vector similarity indexes (run after migrations)
 * Uses HNSW indexes for better performance (PostgreSQL 12+)
 * Falls back to IVFFlat if HNSW is not available
 */
export async function createVectorIndexes(): Promise<void> {
  try {
    // Try to create HNSW indexes (faster, better for similarity search)
    try {
      // HNSW index for text embeddings
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS file_embeddings_embedding_hnsw_idx 
        ON file_embeddings 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);

      // HNSW index for image embeddings
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS file_embeddings_embedding_img_hnsw_idx 
        ON file_embeddings 
        USING hnsw (embedding_img vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);

      console.log('HNSW vector indexes created successfully');
    } catch (hnswError) {
      // Fallback to IVFFlat if HNSW is not supported
      console.warn('HNSW not available, using IVFFlat indexes:', hnswError);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS file_embeddings_embedding_idx 
        ON file_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS file_embeddings_embedding_img_idx 
        ON file_embeddings 
        USING ivfflat (embedding_img vector_cosine_ops)
        WITH (lists = 100)
      `);

      console.log('IVFFlat vector indexes created successfully');
    }

    // Add index on kind for faster filtering
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS file_embeddings_kind_idx 
      ON file_embeddings(kind)
    `);

    // Add partial indexes for better query performance
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS file_embeddings_kind_text_idx 
      ON file_embeddings(kind) 
      WHERE kind = 'text' AND embedding IS NOT NULL
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS file_embeddings_kind_image_idx 
      ON file_embeddings(kind) 
      WHERE kind = 'image' AND embedding_img IS NOT NULL
    `);

    console.log('All vector indexes created successfully');
  } catch (error) {
    console.error('Failed to create vector indexes:', error);
    throw error;
  }
}
