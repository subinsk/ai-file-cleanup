import type { FastifyPluginAsync } from 'fastify';
import { getTextModel, getImageModel, areModelsLoaded } from '../models/loader.js';
import { generateTextEmbeddings } from '../services/text-embeddings.js';
import { generateImageEmbeddings } from '../services/image-embeddings.js';
import { z } from 'zod';

/**
 * Request schemas
 */
const TextEmbeddingRequestSchema = z.object({
  texts: z.array(z.string()).min(1).max(32),
});

const ImageEmbeddingRequestSchema = z.object({
  images: z.array(z.string()).min(1).max(16), // base64 encoded images
});

const BatchEmbeddingRequestSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['text', 'image']),
      content: z.string(), // text or base64 image
    })
  ),
});

/**
 * Embedding routes
 */
export const embeddingRoutes: FastifyPluginAsync = async (server) => {
  /**
   * Health check
   * GET /health
   */
  server.get('/health', async (_request, reply) => {
    const modelsLoaded = areModelsLoaded();
    const memoryUsage = process.memoryUsage();

    reply.status(modelsLoaded ? 200 : 503).send({
      status: modelsLoaded ? 'ok' : 'initializing',
      models: {
        text: getTextModel() !== null,
        image: getImageModel() !== null,
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      uptime: Math.round(process.uptime()),
    });
  });

  /**
   * Generate text embeddings
   * POST /embed/text
   */
  server.post('/embed/text', async (request, reply) => {
    try {
      const body = TextEmbeddingRequestSchema.parse(request.body);

      const startTime = Date.now();
      const embeddings = await generateTextEmbeddings(body.texts);
      const duration = Date.now() - startTime;

      request.log.info(`Generated ${embeddings.length} text embeddings in ${duration}ms`);

      return reply.send({
        embeddings,
        metadata: {
          count: embeddings.length,
          dimension: embeddings[0]?.length || 0,
          duration,
        },
      });
    } catch (error) {
      request.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate text embeddings',
      });
    }
  });

  /**
   * Generate image embeddings
   * POST /embed/image
   */
  server.post('/embed/image', async (request, reply) => {
    try {
      const body = ImageEmbeddingRequestSchema.parse(request.body);

      const startTime = Date.now();
      const embeddings = await generateImageEmbeddings(body.images);
      const duration = Date.now() - startTime;

      request.log.info(`Generated ${embeddings.length} image embeddings in ${duration}ms`);

      return reply.send({
        embeddings,
        metadata: {
          count: embeddings.length,
          dimension: embeddings[0]?.length || 0,
          duration,
        },
      });
    } catch (error) {
      request.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate image embeddings',
      });
    }
  });

  /**
   * Batch embedding generation (mixed text and images)
   * POST /embed/batch
   */
  server.post('/embed/batch', async (request, reply) => {
    try {
      const body = BatchEmbeddingRequestSchema.parse(request.body);

      const startTime = Date.now();
      
      // Separate text and image items
      const textItems = body.items.filter((item: any) => item.type === 'text');
      const imageItems = body.items.filter((item: any) => item.type === 'image');

      // Generate embeddings in parallel
      const [textEmbeddings, imageEmbeddings] = await Promise.all([
        textItems.length > 0
          ? generateTextEmbeddings(textItems.map((item) => item.content))
          : Promise.resolve([]),
        imageItems.length > 0
          ? generateImageEmbeddings(imageItems.map((item) => item.content))
          : Promise.resolve([]),
      ]);

      // Map results back to original IDs
      const results = [];
      let textIndex = 0;
      let imageIndex = 0;

      for (const item of body.items as Array<{ id: string; type: 'text' | 'image'; content: string }>) {
        if (item.type === 'text') {
          results.push({
            id: item.id,
            embedding: textEmbeddings[textIndex]!,
          });
          textIndex++;
        } else {
          results.push({
            id: item.id,
            embedding: imageEmbeddings[imageIndex]!,
          });
          imageIndex++;
        }
      }

      const duration = Date.now() - startTime;

      request.log.info(
        `Generated ${results.length} embeddings (${textItems.length} text, ${imageItems.length} image) in ${duration}ms`
      );

      return reply.send({
        results,
        metadata: {
          total: results.length,
          text: textItems.length,
          image: imageItems.length,
          duration,
        },
      });
    } catch (error) {
      request.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate batch embeddings',
      });
    }
  });
};

