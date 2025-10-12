import type { FastifyRequest, FastifyReply } from 'fastify';
import { userRepository } from '@ai-cleanup/db';

/**
 * Extend Fastify request with user information
 */
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    user?: {
      id: string;
      email: string;
      createdAt: Date;
    };
  }
}

/**
 * Authentication middleware
 * Requires valid session cookie
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.cookies.userId;

  if (!userId) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
      statusCode: 401,
    });
  }

  // Verify user exists
  const user = await userRepository.findById(userId);

  if (!user) {
    reply.clearCookie('userId', { path: '/' });
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid session',
      statusCode: 401,
    });
  }

  // Attach user to request
  request.userId = user.id;
  request.user = {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/**
 * Optional authentication
 * Attaches user if session exists, but doesn't require it
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  const userId = request.cookies.userId;

  if (userId) {
    const user = await userRepository.findById(userId);

    if (user) {
      request.userId = user.id;
      request.user = {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      };
    }
  }
}

