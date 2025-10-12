import { z } from 'zod';

/**
 * License key entity schema
 */
export const LicenseKeySchema = z.object({
  key: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  revoked: z.boolean(),
});

export type LicenseKey = z.infer<typeof LicenseKeySchema>;

/**
 * License validation result
 */
export const LicenseValidationSchema = z.object({
  valid: z.boolean(),
  key: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  revoked: z.boolean().optional(),
  message: z.string().optional(),
});

export type LicenseValidation = z.infer<typeof LicenseValidationSchema>;

