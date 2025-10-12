/**
 * Supported file extensions and MIME types
 */

export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'] as const;
export const SUPPORTED_PDF_EXTENSIONS = ['.pdf'] as const;
export const SUPPORTED_TEXT_EXTENSIONS = ['.txt'] as const;

export const SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ...SUPPORTED_PDF_EXTENSIONS,
  ...SUPPORTED_TEXT_EXTENSIONS,
] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/**
 * MIME type mappings
 */
export const MIME_TYPES = {
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  // PDFs
  '.pdf': 'application/pdf',
  // Text
  '.txt': 'text/plain',
} as const;

/**
 * Similarity thresholds for duplicate detection
 */
export const SIMILARITY_THRESHOLDS = {
  EXACT_MATCH: 0.98,
  HIGH_SIMILARITY: 0.90,
  MEDIUM_SIMILARITY: 0.85,
  LOW_SIMILARITY: 0.70,
} as const;

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_TOTAL_UPLOAD_SIZE: 100 * 1024 * 1024, // 100 MB
  MAX_FILES_PER_UPLOAD: 100,
} as const;

/**
 * Embedding dimensions for different models
 */
export const EMBEDDING_DIMENSIONS = {
  TEXT: 768, // DistilBERT
  IMAGE: 512, // CLIP ViT-B/32
} as const;

/**
 * Match reasons for explainability
 */
export const MATCH_REASONS = {
  EXACT_HASH: 'exact_hash',
  VISUAL_SIMILARITY: 'visual_similarity',
  TEXT_SIMILARITY: 'text_similarity',
  PERCEPTUAL_HASH: 'perceptual_hash',
} as const;

export type MatchReason = (typeof MATCH_REASONS)[keyof typeof MATCH_REASONS];

