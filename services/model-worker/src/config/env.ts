import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server configuration
  PORT: z.coerce.number().int().positive().default(3002),
  HOST: z.string().default('0.0.0.0'),

  // Model configuration
  MODEL_CACHE_DIR: z.string().default('./cache/models'),
  MAX_BATCH_SIZE: z.coerce.number().int().positive().default(16),

  // Text model
  TEXT_MODEL_NAME: z
    .string()
    .default('Xenova/all-MiniLM-L6-v2'), // Smaller, faster alternative to DistilBERT

  // Image model
  IMAGE_MODEL_NAME: z
    .string()
    .default('Xenova/clip-vit-base-patch32'),

  // Performance
  MAX_MEMORY_MB: z.coerce.number().int().positive().default(2048),

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

