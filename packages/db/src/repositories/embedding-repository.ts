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
   * Optimized with proper indexing and retrieval limits
   * @param embedding - Query embedding vector
   * @param threshold - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results (default: 50, max: 200)
   * @param uploadId - Optional: filter by upload ID
   * @returns Array of similar files with similarity scores
   */
  async findSimilarByTextEmbedding(
    embedding: number[],
    threshold: number = 0.85,
    limit: number = 50,
    uploadId?: string
  ): Promise<Array<{ fileId: string; similarity: number }>> {
    const embeddingVector = `[${embedding.join(',')}]`;
    // Enforce maximum limit to prevent performance issues
    const safeLimit = Math.min(limit, 200);

    const query = `
      SELECT 
        fe.file_id,
        1 - (fe.embedding <=> $1::vector) as similarity
      FROM file_embeddings fe
      ${uploadId ? 'JOIN files f ON fe.file_id = f.id' : ''}
      WHERE 
        fe.kind = 'text' 
        AND fe.embedding IS NOT NULL
        ${uploadId ? 'AND f.upload_id = $4::uuid' : ''}
      ORDER BY fe.embedding <=> $1::vector
      LIMIT $3
    `;

    const params: any[] = [embeddingVector, threshold, safeLimit];
    if (uploadId) {
      params.push(uploadId);
    }

    // Use approximate search with index for better performance
    // The WHERE clause filters after index scan for efficiency
    const results = await prisma.$queryRawUnsafe<Array<{ file_id: string; similarity: number }>>(
      query,
      ...params
    );

    // Filter by threshold after retrieval (index helps with ordering)
    return results
      .filter((r) => r.similarity >= threshold)
      .map((r) => ({
        fileId: r.file_id,
        similarity: r.similarity,
      }));
  }

  /**
   * Find similar files by image embedding (cosine similarity)
   * Optimized with proper indexing and retrieval limits
   * @param embedding - Query embedding vector
   * @param threshold - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results (default: 50, max: 200)
   * @param uploadId - Optional: filter by upload ID
   * @returns Array of similar files with similarity scores
   */
  async findSimilarByImageEmbedding(
    embedding: number[],
    threshold: number = 0.85,
    limit: number = 50,
    uploadId?: string
  ): Promise<Array<{ fileId: string; similarity: number }>> {
    const embeddingVector = `[${embedding.join(',')}]`;
    // Enforce maximum limit to prevent performance issues
    const safeLimit = Math.min(limit, 200);

    const query = `
      SELECT 
        fe.file_id,
        1 - (fe.embedding_img <=> $1::vector) as similarity
      FROM file_embeddings fe
      ${uploadId ? 'JOIN files f ON fe.file_id = f.id' : ''}
      WHERE 
        fe.kind = 'image' 
        AND fe.embedding_img IS NOT NULL
        ${uploadId ? 'AND f.upload_id = $4::uuid' : ''}
      ORDER BY fe.embedding_img <=> $1::vector
      LIMIT $3
    `;

    const params: any[] = [embeddingVector, threshold, safeLimit];
    if (uploadId) {
      params.push(uploadId);
    }

    const results = await prisma.$queryRawUnsafe<Array<{ file_id: string; similarity: number }>>(
      query,
      ...params
    );

    // Filter by threshold after retrieval
    return results
      .filter((r) => r.similarity >= threshold)
      .map((r) => ({
        fileId: r.file_id,
        similarity: r.similarity,
      }));
  }

  /**
   * Compute pairwise similarities for files in an upload
   * Optimized with limits and batch processing
   * Returns similarity matrix
   * @param fileIds - Array of file IDs to compare
   * @param kind - Type of embedding ('text' or 'image')
   * @param threshold - Minimum similarity threshold (0-1)
   * @param maxResults - Maximum number of pairs to return (default: 1000)
   */
  async computePairwiseSimilarities(
    fileIds: string[],
    kind: 'text' | 'image',
    threshold: number = 0.85,
    maxResults: number = 1000
  ): Promise<Array<{ file1: string; file2: string; similarity: number }>> {
    // Limit file IDs to prevent excessive computation
    const limitedFileIds = fileIds.slice(0, 100); // Max 100 files for pairwise comparison

    if (limitedFileIds.length < 2) {
      return [];
    }

    const embeddingColumn = kind === 'text' ? 'embedding' : 'embedding_img';
    const safeMaxResults = Math.min(maxResults, 5000); // Hard limit

    const results = await prisma.$queryRawUnsafe<
      Array<{ file1: string; file2: string; similarity: number }>
    >(
      `
      SELECT 
        e1.file_id as file1,
        e2.file_id as file2,
        1 - (e1.${embeddingColumn} <=> e2.${embeddingColumn}) as similarity
      FROM file_embeddings e1
      INNER JOIN file_embeddings e2 ON e1.file_id < e2.file_id
      WHERE 
        e1.file_id = ANY($1::uuid[])
        AND e2.file_id = ANY($1::uuid[])
        AND e1.kind = $2
        AND e2.kind = $2
        AND e1.${embeddingColumn} IS NOT NULL
        AND e2.${embeddingColumn} IS NOT NULL
      ORDER BY e1.${embeddingColumn} <=> e2.${embeddingColumn}
      LIMIT $4
      `,
      limitedFileIds,
      kind,
      threshold,
      safeMaxResults
    );

    // Filter by threshold after retrieval
    return results.filter((r) => r.similarity >= threshold);
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
