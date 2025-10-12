import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env, MAX_FILE_SIZE_BYTES } from './config/env.js';
import { authRoutes } from './routes/auth.js';
import { licenseRoutes } from './routes/license.js';
import { dedupeRoutes } from './routes/dedupe.js';
import { desktopRoutes } from './routes/desktop.js';
import { healthRoutes } from './routes/health.js';
import { checkDatabaseConnection } from '@ai-cleanup/db';

/**
 * Create and configure Fastify server
 */
async function createServer() {
  const server = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
  });

  // Register CORS
  await server.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register cookie support
  await server.register(cookie, {
    secret: env.SESSION_SECRET,
    parseOptions: {},
  });

  // Register rate limiting
  await server.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    ban: 3, // Ban after 3 violations
    cache: 10000, // Cache 10k rate limit entries
  });

  // Register multipart/form-data support for file uploads
  await server.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
      files: env.MAX_FILES_PER_UPLOAD,
    },
    attachFieldsToBody: true,
  });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode ?? 500;
    const message = error.message || 'Internal Server Error';

    reply.status(statusCode).send({
      error: error.name || 'Error',
      message,
      statusCode,
    });
  });

  // Health check (no auth required)
  await server.register(healthRoutes, { prefix: '/' });

  // Authentication routes
  await server.register(authRoutes, { prefix: '/auth' });

  // License management routes
  await server.register(licenseRoutes, { prefix: '/license' });

  // Deduplication routes (web app)
  await server.register(dedupeRoutes, { prefix: '/dedupe' });

  // Desktop app routes
  await server.register(desktopRoutes, { prefix: '/desktop' });

  return server;
}

/**
 * Start server
 */
async function start() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Create and start server
    const server = await createServer();

    await server.listen({
      port: env.API_PORT,
      host: env.API_HOST,
    });

    console.log(`🚀 API server running at http://${env.API_HOST}:${env.API_PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start server
start();

