import { z } from 'zod';
import { LicenseValidationSchema } from '../license';
import { FileMetadataSchema } from '../file';
import { DedupeResultSchema } from '../dedupe';

/**
 * License validation request
 */
export const ValidateLicenseRequestSchema = z.object({
  key: z.string().uuid(),
});

export type ValidateLicenseRequest = z.infer<typeof ValidateLicenseRequestSchema>;

/**
 * License validation response
 */
export const ValidateLicenseResponseSchema = LicenseValidationSchema;

export type ValidateLicenseResponse = z.infer<typeof ValidateLicenseResponseSchema>;

/**
 * Desktop dedupe preview request
 */
export const DesktopDedupeRequestSchema = z.object({
  licenseKey: z.string().uuid(),
  files: z.array(
    FileMetadataSchema.extend({
      path: z.string(),
      // Optional: small sample for embedding generation
      sampleData: z.string().optional(), // base64 encoded
    })
  ),
  threshold: z.number().min(0).max(1).optional(),
});

export type DesktopDedupeRequest = z.infer<typeof DesktopDedupeRequestSchema>;

/**
 * Desktop dedupe response
 */
export const DesktopDedupeResponseSchema = DedupeResultSchema;

export type DesktopDedupeResponse = z.infer<typeof DesktopDedupeResponseSchema>;

