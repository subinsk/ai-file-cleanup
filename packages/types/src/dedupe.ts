import { z } from 'zod';
import { FileMetadataSchema } from './file';
import { MATCH_REASONS } from './constants';

/**
 * Similarity score between two files
 */
export const SimilarityScoreSchema = z.object({
  fileId1: z.string().uuid(),
  fileId2: z.string().uuid(),
  score: z.number().min(0).max(1),
  reason: z.enum([
    MATCH_REASONS.EXACT_HASH,
    MATCH_REASONS.VISUAL_SIMILARITY,
    MATCH_REASONS.TEXT_SIMILARITY,
    MATCH_REASONS.PERCEPTUAL_HASH,
  ]),
});

export type SimilarityScore = z.infer<typeof SimilarityScoreSchema>;

/**
 * Duplicate match information
 */
export const DuplicateMatchSchema = z.object({
  file: FileMetadataSchema,
  similarity: z.number().min(0).max(1),
  reason: z.string(),
  isKept: z.boolean(),
});

export type DuplicateMatch = z.infer<typeof DuplicateMatchSchema>;

/**
 * Dedupe group (one keep file + duplicates)
 */
export const DedupeGroupSchema = z.object({
  id: z.string().uuid(),
  groupIndex: z.number().int(),
  keepFile: FileMetadataSchema,
  duplicates: z.array(DuplicateMatchSchema),
  reason: z.string(),
  totalSizeSaved: z.number().int(), // bytes saved by removing duplicates
});

export type DedupeGroup = z.infer<typeof DedupeGroupSchema>;

/**
 * Dedupe result summary
 */
export const DedupeResultSchema = z.object({
  uploadId: z.string().uuid(),
  totalFiles: z.number().int(),
  groups: z.array(DedupeGroupSchema),
  uniqueFiles: z.array(FileMetadataSchema), // files with no duplicates
  totalFilesKept: z.number().int(),
  totalFilesRemoved: z.number().int(),
  totalSizeSaved: z.number().int(),
});

export type DedupeResult = z.infer<typeof DedupeResultSchema>;

/**
 * Database dedupe group record
 */
export const DedupeGroupRecordSchema = z.object({
  id: z.string().uuid(),
  uploadId: z.string().uuid(),
  groupIndex: z.number().int(),
  keptFileId: z.string().uuid().optional(),
});

export type DedupeGroupRecord = z.infer<typeof DedupeGroupRecordSchema>;

