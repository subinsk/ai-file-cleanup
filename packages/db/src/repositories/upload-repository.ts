import { prisma } from '../client';
import type { Upload } from '@prisma/client';

/**
 * Upload session repository
 */
export class UploadRepository {
  /**
   * Find upload by ID
   */
  async findById(id: string): Promise<Upload | null> {
    return prisma.upload.findUnique({
      where: { id },
      include: {
        user: true,
        files: true,
        dedupeGroups: true,
      },
    });
  }

  /**
   * Create a new upload session
   */
  async create(data: {
    userId?: string;
    totalFiles: number;
  }): Promise<Upload> {
    return prisma.upload.create({
      data: {
        userId: data.userId,
        totalFiles: data.totalFiles,
      },
    });
  }

  /**
   * Update upload
   */
  async update(
    id: string,
    data: {
      totalFiles?: number;
    }
  ): Promise<Upload> {
    return prisma.upload.update({
      where: { id },
      data,
    });
  }

  /**
   * Find uploads by user ID
   */
  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Upload[]> {
    return prisma.upload.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        files: {
          select: {
            id: true,
            fileName: true,
            sizeBytes: true,
          },
        },
      },
    });
  }

  /**
   * Delete upload and related data
   */
  async delete(id: string): Promise<void> {
    await prisma.upload.delete({
      where: { id },
    });
  }

  /**
   * Delete old uploads (cleanup)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.upload.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
    return result.count;
  }

  /**
   * Count uploads for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return prisma.upload.count({
      where: { userId },
    });
  }
}

export const uploadRepository = new UploadRepository();

