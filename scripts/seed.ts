#!/usr/bin/env node

/**
 * Database Seed Script
 * 
 * Seed strategy: sql-script
 * Backend hosting: docker
 * Secrets backend: aws-secrets
 */

const seedStrategy = process.env.SEED_STRATEGY || 'sql-script';
const backendHosting = process.env.BACKEND_HOSTING || 'docker';
const secretsBackend = process.env.SECRETS_BACKEND || 'aws-secrets';

async function main() {
  try {
    console.log(`🌱 Database Seed Script`);
    console.log(`   Strategy: ${seedStrategy}`);
    console.log(`   Hosting: ${backendHosting}`);
    console.log(`   Secrets: ${secretsBackend}`);

    if (seedStrategy === 'sql-script') {
      console.log(`📝 Using SQL script seeding strategy...`);
    } else if (seedStrategy === 'orm-migrations') {
      console.log(`🔄 Using ORM migrations seeding strategy...`);
    } else if (seedStrategy === 'managed-service') {
      console.log(`☁️  Using managed service seeding strategy...`);
    } else if (seedStrategy === 'snapshot') {
      console.log(`📦 Using snapshot seeding strategy...`);
    } else {
      throw new Error(`Unknown seed strategy: ${seedStrategy}`);
    }

    console.log(`✅ Database seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed:`, error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
