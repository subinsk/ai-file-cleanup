import { z } from 'zod';

/**
 * User entity schema
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * User creation schema (without id and timestamps)
 */
export const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;

/**
 * User update schema
 */
export const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

/**
 * Public user info (without sensitive data)
 */
export const UserPublicSchema = UserSchema.omit({ passwordHash: true });

export type UserPublic = z.infer<typeof UserPublicSchema>;

