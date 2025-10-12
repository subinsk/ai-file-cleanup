import { prisma } from '../client';
import type { LicenseKey } from '@prisma/client';

/**
 * License key repository
 */
export class LicenseRepository {
  /**
   * Find license key by key value
   */
  async findByKey(key: string): Promise<LicenseKey | null> {
    return prisma.licenseKey.findUnique({
      where: { key },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find all license keys for a user
   */
  async findByUserId(userId: string): Promise<LicenseKey[]> {
    return prisma.licenseKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new license key
   */
  async create(userId: string): Promise<LicenseKey> {
    return prisma.licenseKey.create({
      data: {
        userId,
      },
    });
  }

  /**
   * Revoke a license key
   */
  async revoke(key: string): Promise<LicenseKey> {
    return prisma.licenseKey.update({
      where: { key },
      data: { revoked: true },
    });
  }

  /**
   * Validate license key
   * Returns null if invalid or revoked
   */
  async validate(key: string): Promise<LicenseKey | null> {
    const license = await this.findByKey(key);
    
    if (!license || license.revoked) {
      return null;
    }
    
    return license;
  }

  /**
   * Count active license keys for a user
   */
  async countActiveByUserId(userId: string): Promise<number> {
    return prisma.licenseKey.count({
      where: {
        userId,
        revoked: false,
      },
    });
  }

  /**
   * Delete license key (hard delete)
   */
  async delete(key: string): Promise<void> {
    await prisma.licenseKey.delete({
      where: { key },
    });
  }
}

export const licenseRepository = new LicenseRepository();

