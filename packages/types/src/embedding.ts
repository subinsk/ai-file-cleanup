import { z } from 'zod';

/**
 * Embedding kind
 */
export const EmbeddingKindSchema = z.enum(['image', 'text']);
export type EmbeddingKind = z.infer<typeof EmbeddingKindSchema>;

/**
 * File embedding schema
 */
export const FileEmbeddingSchema = z.object({
  fileId: z.string().uuid(),
  kind: EmbeddingKindSchema,
  embedding: z.array(z.number()).optional(), // Text embedding (768-dim)
  embeddingImg: z.array(z.number()).optional(), // Image embedding (512-dim)
});

export type FileEmbedding = z.infer<typeof FileEmbeddingSchema>;

/**
 * Embedding request/response
 */
export const EmbeddingRequestSchema = z.object({
  id: z.string(),
  type: EmbeddingKindSchema,
  content: z.union([z.string(), z.instanceof(Buffer)]),
});

export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;

export const EmbeddingResponseSchema = z.object({
  id: z.string(),
  embedding: z.array(z.number()),
});

export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>;

