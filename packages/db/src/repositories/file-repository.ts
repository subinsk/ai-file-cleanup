import { prisma } from '../client';
import type { File } from '@prisma/client';

/**
 * File metadata repository
 */
export class FileRepository {
  /**
   * Find file by ID
   */
  async findById(id: string): Promise<File | null> {
    return prisma.file.findUnique({
      where: { id },
      include: {
        embedding: true,
      },
    });
  }

  /**
   * Find file by SHA-256 hash
   */
  async findBySha256(sha256: string): Promise<File[]> {
    return prisma.file.findMany({
      where: { sha256 },
    });
  }

  /**
   * Find files by perceptual hash
   */
  async findByPhash(phash: string): Promise<File[]> {
    return prisma.file.findMany({
      where: { phash },
    });
  }

  /**
   * Find files by upload ID
   */
  async findByUploadId(uploadId: string): Promise<File[]> {
    return prisma.file.findMany({
      where: { uploadId },
      include: {
        embedding: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a new file record
   */
  async create(data: {
    uploadId?: string;
    fileName: string;
    mimeType: string;
    sizeBytes: bigint;
    sha256: string;
    phash?: string;
    textExcerpt?: string;
  }): Promise<File> {
    return prisma.file.create({
      data,
    });
  }

  /**
   * Create multiple files (batch insert)
   */
  async createMany(
    files: Array<{
      uploadId?: string;
      fileName: string;
      mimeType: string;
      sizeBytes: bigint;
      sha256: string;
      phash?: string;
      textExcerpt?: string;
    }>
  ): Promise<number> {
    const result = await prisma.file.createMany({
      data: files,
    });
    return result.count;
  }

  /**
   * Update file metadata
   */
  async update(
    id: string,
    data: {
      phash?: string;
      textExcerpt?: string;
    }
  ): Promise<File> {
    return prisma.file.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete file
   */
  async delete(id: string): Promise<void> {
    await prisma.file.delete({
      where: { id },
    });
  }

  /**
   * Delete files by upload ID
   */
  async deleteByUploadId(uploadId: string): Promise<number> {
    const result = await prisma.file.deleteMany({
      where: { uploadId },
    });
    return result.count;
  }

  /**
   * Find duplicate files by exact hash
   */
  async findExactDuplicates(uploadId: string): Promise<Map<string, File[]>> {
    const files = await this.findByUploadId(uploadId);
    
    const hashMap = new Map<string, File[]>();
    for (const file of files) {
      const existing = hashMap.get(file.sha256);
      if (existing) {
        existing.push(file);
      } else {
        hashMap.set(file.sha256, [file]);
      }
    }
    
    // Filter to only return groups with duplicates
    const duplicates = new Map<string, File[]>();
    for (const [hash, fileGroup] of hashMap.entries()) {
      if (fileGroup.length > 1) {
        duplicates.set(hash, fileGroup);
      }
    }
    
    return duplicates;
  }

  /**
   * Count files by upload ID
   */
  async countByUploadId(uploadId: string): Promise<number> {
    return prisma.file.count({
      where: { uploadId },
    });
  }

  /**
   * Calculate total size of files in upload
   */
  async getTotalSizeByUploadId(uploadId: string): Promise<bigint> {
    const result = await prisma.file.aggregate({
      where: { uploadId },
      _sum: {
        sizeBytes: true,
      },
    });
    return result._sum.sizeBytes || BigInt(0);
  }
}

export const fileRepository = new FileRepository();

