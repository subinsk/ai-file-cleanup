import type { FastifyPluginAsync } from 'fastify';
import { createHash } from 'crypto';
import { userRepository } from '@ai-cleanup/db';
import { LoginRequestSchema, type LoginRequest } from '@ai-cleanup/types';

/**
 * Simple password hashing (development only)
 * In production, use bcrypt or argon2
 */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password
 */
function verifyPassword(password: string, hash: string): boolean {
  const inputHash = hashPassword(password);
  return inputHash === hash;
}

/**
 * Authentication routes
 */
export const authRoutes: FastifyPluginAsync = async (server) => {
  /**
   * Login endpoint
   * POST /auth/login
   */
  server.post<{ Body: LoginRequest }>('/login', async (request, reply) => {
    try {
      // Validate request body
      const body = LoginRequestSchema.parse(request.body);

      // Find user by email
      const user = await userRepository.findByEmail(body.email);

      if (!user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          statusCode: 401,
        });
      }

      // Verify password
      const valid = verifyPassword(body.password, user.passwordHash);

      if (!valid) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          statusCode: 401,
        });
      }

      // Create session (simplified - store user ID in cookie)
      reply.setCookie('userId', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      // Return user info (without password)
      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        message: 'Login successful',
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
   * Logout endpoint
   * POST /auth/logout
   */
  server.post('/logout', async (_request, reply) => {
    reply.clearCookie('userId', { path: '/' });

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * Get current user (check authentication)
   * GET /auth/me
   */
  server.get('/me', async (request,reply) => {
    const userId = request.cookies.userId;

    if (!userId) {
      return reply.status(401).send({
        authenticated: false,
      });
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      reply.clearCookie('userId', { path: '/' });
      return reply.status(401).send({
        authenticated: false,
      });
    }

    return reply.send({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });
};

