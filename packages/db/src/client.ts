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
 * Create vector similarity indexes (run after migrations)
 */
export async function createVectorIndexes(): Promise<void> {
  try {
    // Create IVFFlat index for text embeddings (cosine similarity)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS file_embeddings_embedding_idx 
      ON file_embeddings 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Create IVFFlat index for image embeddings (cosine similarity)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS file_embeddings_embedding_img_idx 
      ON file_embeddings 
      USING ivfflat (embedding_img vector_cosine_ops)
      WITH (lists = 100)
    `);

    console.log('Vector indexes created successfully');
  } catch (error) {
    console.error('Failed to create vector indexes:', error);
    throw error;
  }
}

