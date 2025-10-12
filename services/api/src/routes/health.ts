import type { FastifyPluginAsync } from 'fastify';
import { checkDatabaseConnection } from '@ai-cleanup/db';

/**
 * Health check routes
 */
export const healthRoutes: FastifyPluginAsync = async (server) => {
  /**
   * Health check endpoint
   * GET /healthz
   */
  server.get('/healthz', async (_request, reply) => {
    const dbConnected = await checkDatabaseConnection();

    const status = dbConnected ? 'ok' : 'degraded';

    reply.status(dbConnected ? 200 : 503).send({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected,
      },
    });
  });

  /**
   * Version information
   * GET /version
   */
  server.get('/version', async (_request, reply) => {
    reply.send({
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      buildDate: new Date().toISOString(),
    });
  });
};

