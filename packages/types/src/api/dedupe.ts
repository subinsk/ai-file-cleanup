import { z } from 'zod';
import { DedupeResultSchema } from '../dedupe';

/**
 * Dedupe preview request (multipart files in actual request)
 */
export const DedupePreviewRequestSchema = z.object({
  // Files are sent as multipart, metadata can be included here
  threshold: z.number().min(0).max(1).optional(),
});

export type DedupePreviewRequest = z.infer<typeof DedupePreviewRequestSchema>;

/**
 * Dedupe preview response
 */
export const DedupePreviewResponseSchema = DedupeResultSchema;

export type DedupePreviewResponse = z.infer<typeof DedupePreviewResponseSchema>;

/**
 * ZIP download request
 */
export const ZipDownloadRequestSchema = z.object({
  uploadId: z.string().uuid(),
  selectedFileIds: z.array(z.string().uuid()),
});

export type ZipDownloadRequest = z.infer<typeof ZipDownloadRequestSchema>;

/**
 * Error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
  details: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

