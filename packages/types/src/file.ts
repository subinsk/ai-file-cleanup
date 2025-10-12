import { z } from 'zod';

/**
 * File type enum
 */
export const FileTypeSchema = z.enum(['image', 'pdf', 'text', 'other']);
export type FileType = z.infer<typeof FileTypeSchema>;

/**
 * Supported MIME types
 */
export const MimeTypeSchema = z.enum([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);
export type MimeType = z.infer<typeof MimeTypeSchema>;

/**
 * File metadata schema
 */
export const FileMetadataSchema = z.object({
  id: z.string().uuid(),
  uploadId: z.string().uuid().optional(),
  fileName: z.string(),
  mimeType: MimeTypeSchema,
  sizeBytes: z.number().int().positive(),
  sha256: z.string(),
  phash: z.string().optional(),
  textExcerpt: z.string().optional(),
  createdAt: z.date(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

/**
 * File with local path (for desktop app)
 */
export const FileWithPathSchema = FileMetadataSchema.extend({
  path: z.string(),
});

export type FileWithPath = z.infer<typeof FileWithPathSchema>;

/**
 * File upload info
 */
export const FileUploadInfoSchema = z.object({
  name: z.string(),
  size: z.number().int().positive(),
  type: z.string(),
  lastModified: z.number().optional(),
});

export type FileUploadInfo = z.infer<typeof FileUploadInfoSchema>;

