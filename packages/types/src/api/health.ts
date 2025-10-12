import { z } from 'zod';

/**
 * Health check response
 */
export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  timestamp: z.string().datetime(),
  services: z.object({
    database: z.boolean(),
    modelWorker: z.boolean().optional(),
  }),
  version: z.string().optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/**
 * Version response
 */
export const VersionResponseSchema = z.object({
  version: z.string(),
  buildDate: z.string().optional(),
  commit: z.string().optional(),
  environment: z.string().optional(),
});

export type VersionResponse = z.infer<typeof VersionResponseSchema>;

