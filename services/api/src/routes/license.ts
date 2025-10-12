import type { FastifyPluginAsync } from 'fastify';
import { licenseRepository } from '@ai-cleanup/db';
import { requireAuth } from '../middleware/auth.js';

/**
 * License management routes
 */
export const licenseRoutes: FastifyPluginAsync = async (server) => {
  /**
   * Generate new license key
   * POST /license/generate
   */
  server.post('/generate', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    try {
      // Create new license key
      const license = await licenseRepository.create(userId);

      return reply.send({
        key: license.key,
        createdAt: license.createdAt,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate license key',
        statusCode: 500,
      });
    }
  });

  /**
   * List user's license keys
   * GET /license/list
   */
  server.get('/list', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    try {
      const licenses = await licenseRepository.findByUserId(userId);

      return reply.send({
        licenses: licenses.map((license) => ({
          key: license.key,
          createdAt: license.createdAt,
          revoked: license.revoked,
        })),
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch licenses',
        statusCode: 500,
      });
    }
  });

  /**
   * Revoke license key
   * DELETE /license/:key
   */
  server.delete<{ Params: { key: string } }>(
    '/:key',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { key } = request.params;

      try {
        // Verify ownership
        const license = await licenseRepository.findByKey(key);

        if (!license) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'License key not found',
            statusCode: 404,
          });
        }

        if (license.userId !== userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not own this license key',
            statusCode: 403,
          });
        }

        // Revoke license
        await licenseRepository.revoke(key);

        return reply.send({
          success: true,
          message: 'License key revoked',
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to revoke license',
          statusCode: 500,
        });
      }
    }
  );
};

