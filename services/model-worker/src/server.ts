import 'dotenv/config';
import Fastify from 'fastify';
import { env } from './config/env.js';
import { initializeModels } from './models/loader.js';
import { embeddingRoutes } from './routes/embeddings.js';

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

  // Register routes
  await server.register(embeddingRoutes);

  return server;
}

/**
 * Start server
 */
async function start() {
  try {
    console.log('🤖 Initializing AI models...');
    console.log('📦 Downloading models (this may take a few minutes on first run)...');
    
    // Initialize models (download and cache)
    await initializeModels();
    
    console.log('✅ Models loaded successfully!');

    // Create and start server
    const server = await createServer();

    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 Model Worker running at http://${env.HOST}:${env.PORT}`);
    console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
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

