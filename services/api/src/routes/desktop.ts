import type { FastifyPluginAsync } from 'fastify';
import { licenseRepository } from '@ai-cleanup/db';
import { ValidateLicenseRequestSchema } from '@ai-cleanup/types';

/**
 * Desktop app specific routes
 */
export const desktopRoutes: FastifyPluginAsync = async (server) => {
  /**
   * Validate license key for desktop app
   * POST /desktop/validate-license
   */
  server.post('/validate-license', async (request, reply) => {
    try {
      const body = ValidateLicenseRequestSchema.parse(request.body);

      const license = await licenseRepository.validate(body.key);

      if (!license) {
        return reply.send({
          valid: false,
          message: 'Invalid or revoked license key',
        });
      }

      return reply.send({
        valid: true,
        key: license.key,
        userId: license.userId,
        revoked: license.revoked,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid request data',
        statusCode: 400,
      });
    }
  });

  /**
   * Desktop dedupe preview endpoint
   * POST /desktop/dedupe/preview
   */
  server.post('/dedupe/preview', async (request, reply) => {
    try {
      // TODO: Implement desktop deduplication
      // Similar to web /dedupe/preview but:
      // 1. Validate license key in request
      // 2. Accept file metadata instead of multipart
      // 3. Option to accept pre-computed embeddings
      // 4. Return duplicate groups

      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Desktop dedupe not yet implemented',
        statusCode: 501,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to process files',
        statusCode: 500,
      });
    }
  });
};

