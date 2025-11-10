/**
 * Script to run migrations on both local and Neon databases
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Database URLs
const LOCAL_DB_URL = 'postgresql://postgres:admin@localhost:5433/ai_file_cleanup';
const NEON_DB_URL =
  'postgresql://neondb_owner:npg_8SR4galwVZcW@ep-divine-fire-a193qywk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const MIGRATION_FILE = path.join(
  __dirname,
  '../prisma/migrations/20250127000000_optimize_vector_indexes/migration.sql'
);

async function runMigrationOnDatabase(dbUrl: string, dbName: string) {
  console.log(`\n🔄 Running migration on ${dbName}...`);

  try {
    // Create a temporary Prisma client with the database URL
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    // Test connection
    await prisma.$connect();
    console.log(`✅ Connected to ${dbName}`);

    // Read migration SQL
    const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf-8');

    // Split into individual statements (semicolon-separated)
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`  ✓ Executed: ${statement.substring(0, 50)}...`);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('does not exist')
          ) {
            console.log(
              `  ⚠ Skipped (already exists or not needed): ${statement.substring(0, 50)}...`
            );
          } else {
            throw error;
          }
        }
      }
    }

    // Verify indexes were created
    const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'file_embeddings' AND indexname LIKE '%hnsw%'`
    );

    console.log(`\n✅ Migration completed on ${dbName}`);
    console.log(`   Created ${indexes.length} HNSW indexes:`);
    indexes.forEach((idx) => console.log(`   - ${idx.indexname}`));

    await prisma.$disconnect();
  } catch (error: any) {
    console.error(`❌ Error migrating ${dbName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting migration on both databases...\n');

  // Run on local database
  try {
    await runMigrationOnDatabase(LOCAL_DB_URL, 'Local Database');
  } catch (error: any) {
    console.error('❌ Failed to migrate local database:', error.message);
    console.log('   Continuing with Neon database...\n');
  }

  // Run on Neon database
  try {
    await runMigrationOnDatabase(NEON_DB_URL, 'Neon Database');
  } catch (error: any) {
    console.error('❌ Failed to migrate Neon database:', error.message);
  }

  console.log('\n✨ Migration process completed!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
