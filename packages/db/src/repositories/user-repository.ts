import { prisma } from '../client';
import type { User } from '@prisma/client';

/**
 * User repository for database operations
 */
export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
      },
    });
  }

  /**
   * Update user
   */
  async update(
    id: string,
    data: {
      email?: string;
      passwordHash?: string;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * List all users (for admin/testing)
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    return prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    return prisma.user.count();
  }
}

export const userRepository = new UserRepository();

