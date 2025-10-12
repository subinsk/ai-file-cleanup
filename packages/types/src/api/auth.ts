import { z } from 'zod';
import { UserPublicSchema } from '../user';

/**
 * Login request
 */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Login response
 */
export const LoginResponseSchema = z.object({
  user: UserPublicSchema,
  message: z.string().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Logout response
 */
export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

/**
 * Auth status response
 */
export const AuthStatusResponseSchema = z.object({
  authenticated: z.boolean(),
  user: UserPublicSchema.optional(),
});

export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;

