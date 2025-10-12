import { prisma } from '../client';
import type { FileEmbedding, FileEmbeddingKind } from '@prisma/client';

/**
 * Vector embedding repository with pgvector support
 */
export class EmbeddingRepository {
  /**
   * Find embedding by file ID
   */
  async findByFileId(fileId: string): Promise<FileEmbedding | null> {
    return prisma.fileEmbedding.findUnique({
      where: { fileId },
    });
  }

  /**
   * Create or update embedding
   */
  async upsert(data: {
    fileId: string;
    kind: FileEmbeddingKind;
    embedding?: number[];
    embeddingImg?: number[];
  }): Promise<FileEmbedding> {
    // Convert number arrays to pgvector format
    const embeddingVector = data.embedding ? `[${data.embedding.join(',')}]` : null;
    const embeddingImgVector = data.embeddingImg ? `[${data.embeddingImg.join(',')}]` : null;

    return prisma.$executeRawUnsafe(
      `
      INSERT INTO file_embeddings (file_id, kind, embedding, embedding_img)
      VALUES ($1, $2, $3::vector, $4::vector)
      ON CONFLICT (file_id) 
      DO UPDATE SET 
        kind = $2,
        embedding = COALESCE($3::vector, file_embeddings.embedding),
        embedding_img = COALESCE($4::vector, file_embeddings.embedding_img)
      RETURNING *
      `,
      data.fileId,
      data.kind,
      embeddingVector,
      embeddingImgVector
    ) as unknown as FileEmbedding;
  }

  /**
   * Batch insert embeddings
   */
  async createMany(
    embeddings: Array<{
      fileId: string;
      kind: FileEmbeddingKind;
      embedding?: number[];
      embeddingImg?: number[];
    }>
  ): Promise<void> {
    for (const emb of embeddings) {
      await this.upsert(emb);
    }
  }

  /**
   * Find similar files by text embedding (cosine similarity)
   * @param embedding - Query embedding vector
   * @param threshold - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results
   * @returns Array of similar files with similarity scores
   */
  async findSimilarByTextEmbedding(
    embedding: number[],
    threshold: number = 0.85,
    limit: number = 100
  ): Promise<Array<{ fileId: string; similarity: number }>> {
    const embeddingVector = `[${embedding.join(',')}]`;

    const results = await prisma.$queryRawUnsafe<
      Array<{ file_id: string; similarity: number }>
    >(
      `
      SELECT 
        file_id,
        1 - (embedding <=> $1::vector) as similarity
      FROM file_embeddings
      WHERE 
        kind = 'text' 
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> $1::vector) >= $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
      `,
      embeddingVector,
      threshold,
      limit
    );

    return results.map((r) => ({
      fileId: r.file_id,
      similarity: r.similarity,
    }));
  }

  /**
   * Find similar files by image embedding (cosine similarity)
   * @param embedding - Query embedding vector
   * @param threshold - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results
   * @returns Array of similar files with similarity scores
   */
  async findSimilarByImageEmbedding(
    embedding: number[],
    threshold: number = 0.85,
    limit: number = 100
  ): Promise<Array<{ fileId: string; similarity: number }>> {
    const embeddingVector = `[${embedding.join(',')}]`;

    const results = await prisma.$queryRawUnsafe<
      Array<{ file_id: string; similarity: number }>
    >(
      `
      SELECT 
        file_id,
        1 - (embedding_img <=> $1::vector) as similarity
      FROM file_embeddings
      WHERE 
        kind = 'image' 
        AND embedding_img IS NOT NULL
        AND 1 - (embedding_img <=> $1::vector) >= $2
      ORDER BY embedding_img <=> $1::vector
      LIMIT $3
      `,
      embeddingVector,
      threshold,
      limit
    );

    return results.map((r) => ({
      fileId: r.file_id,
      similarity: r.similarity,
    }));
  }

  /**
   * Compute pairwise similarities for files in an upload
   * Returns similarity matrix
   */
  async computePairwiseSimilarities(
    fileIds: string[],
    kind: 'text' | 'image',
    threshold: number = 0.85
  ): Promise<Array<{ file1: string; file2: string; similarity: number }>> {
    const embeddingColumn = kind === 'text' ? 'embedding' : 'embedding_img';

    const results = await prisma.$queryRawUnsafe<
      Array<{ file1: string; file2: string; similarity: number }>
    >(
      `
      SELECT 
        e1.file_id as file1,
        e2.file_id as file2,
        1 - (e1.${embeddingColumn} <=> e2.${embeddingColumn}) as similarity
      FROM file_embeddings e1
      CROSS JOIN file_embeddings e2
      WHERE 
        e1.file_id = ANY($1::uuid[])
        AND e2.file_id = ANY($1::uuid[])
        AND e1.file_id < e2.file_id
        AND e1.kind = $2
        AND e2.kind = $2
        AND e1.${embeddingColumn} IS NOT NULL
        AND e2.${embeddingColumn} IS NOT NULL
        AND 1 - (e1.${embeddingColumn} <=> e2.${embeddingColumn}) >= $3
      ORDER BY similarity DESC
      `,
      fileIds,
      kind,
      threshold
    );

    return results;
  }

  /**
   * Delete embedding
   */
  async delete(fileId: string): Promise<void> {
    await prisma.fileEmbedding.delete({
      where: { fileId },
    });
  }

  /**
   * Count embeddings by kind
   */
  async countByKind(kind: FileEmbeddingKind): Promise<number> {
    return prisma.fileEmbedding.count({
      where: { kind },
    });
  }
}

export const embeddingRepository = new EmbeddingRepository();

