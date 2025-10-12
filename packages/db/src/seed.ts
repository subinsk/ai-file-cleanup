#!/usr/bin/env tsx

/**
 * Database seed script
 * Creates test users and sample data for development
 */

import { prisma } from './client';
import { createHash } from 'crypto';

/**
 * Hash password (simple SHA-256 for development)
 * In production, use bcrypt or argon2
 */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create test users
    const testUsers = [
      {
        email: 'test@example.com',
        password: 'password123',
      },
      {
        email: 'demo@example.com',
        password: 'demo123',
      },
      {
        email: 'admin@example.com',
        password: 'admin123',
      },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: hashPassword(userData.password),
        },
      });

      console.log(`✅ Created user: ${user.email}`);

      // Create a license key for each user
      const license = await prisma.licenseKey.create({
        data: {
          userId: user.id,
        },
      });

      console.log(`   🔑 License key: ${license.key}`);
    }

    // Print summary
    console.log('\n📊 Database seeded successfully!');
    console.log('\n🔐 Test Credentials:');
    for (const userData of testUsers) {
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log('');
    }

    console.log('💡 Use these credentials to log in to the web app');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

