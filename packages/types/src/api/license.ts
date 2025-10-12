import { z } from 'zod';

/**
 * Generate license key request
 */
export const GenerateLicenseRequestSchema = z.object({
  // No body needed - userId comes from auth
});

export type GenerateLicenseRequest = z.infer<typeof GenerateLicenseRequestSchema>;

/**
 * Generate license key response
 */
export const GenerateLicenseResponseSchema = z.object({
  key: z.string().uuid(),
  createdAt: z.string(),
});

export type GenerateLicenseResponse = z.infer<typeof GenerateLicenseResponseSchema>;

/**
 * List licenses response
 */
export const ListLicensesResponseSchema = z.object({
  licenses: z.array(
    z.object({
      key: z.string().uuid(),
      createdAt: z.string(),
      revoked: z.boolean(),
    })
  ),
});

export type ListLicensesResponse = z.infer<typeof ListLicensesResponseSchema>;

/**
 * Revoke license response
 */
export const RevokeLicenseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type RevokeLicenseResponse = z.infer<typeof RevokeLicenseResponseSchema>;
