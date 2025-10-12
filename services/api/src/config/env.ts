import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // API configuration
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // Session
  SESSION_SECRET: z.string().min(32),

  // CORS
  CORS_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((origin) => origin.trim()))
    .default('http://localhost:3000'),

  // File upload limits
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
  MAX_TOTAL_UPLOAD_SIZE_MB: z.coerce.number().positive().default(100),
  MAX_FILES_PER_UPLOAD: z.coerce.number().int().positive().default(100),

  // Similarity thresholds
  EXACT_MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.98),
  HIGH_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.9),
  MEDIUM_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.85),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 minutes

  // Model worker
  MODEL_WORKER_URL: z.string().url().default('http://localhost:3002'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

/**
 * Parse and validate environment variables
 */
function parseEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  return parsed.data;
}

export const env = parseEnv();

// Export derived values
export const MAX_FILE_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_SIZE_BYTES = env.MAX_TOTAL_UPLOAD_SIZE_MB * 1024 * 1024;

