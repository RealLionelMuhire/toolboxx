#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * 
 * ⚠️  CRITICAL WARNING ⚠️
 * This script will seed data to the PRODUCTION database!
 * 
 * Database: mongodb+srv://toolbay01_db_user:***@toolbayproductioncluste.aq3gvoz.mongodb.net/
 * 
 * What will be created:
 * 1. Admin User: admin@toolbay.net (password: demo)
 * 2. Admin Tenant: Toolbay Admin (verified)
 * 3. All product categories and subcategories
 * 
 * ⚠️  Run this ONLY ONCE on a fresh database!
 * ⚠️  This will NOT delete existing data
 */

import dotenv from 'dotenv';
import { execSync } from 'child_process';
import readline from 'readline';

// Production database URI — pass via env: DATABASE_URI=... node scripts/seed-production.mjs
const PRODUCTION_DB_URI = process.env.DATABASE_URI;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║         🚨 PRODUCTION DATABASE SEEDING - CONFIRMATION 🚨        ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('⚠️  WARNING: You are about to seed the PRODUCTION database!');
console.log('');
console.log('Database: toolbayproductioncluste.aq3gvoz.mongodb.net');
console.log('');
console.log('This will create:');
console.log('  ✓ Admin user: admin@toolbay.net (password: demo)');
console.log('  ✓ Admin tenant: Toolbay Admin (verified)');
console.log('  ✓ All product categories (8 main + subcategories)');
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('  - Run this ONLY on a fresh/empty database');
console.log('  - This will NOT delete existing data');
console.log('  - Duplicate entries may be created if run multiple times');
console.log('  - Change admin password immediately after seeding');
console.log('');

async function confirmAndSeed() {
  try {
    // First confirmation
    const confirm1 = await question('Do you want to continue? (type "yes" to proceed): ');
    
    if (confirm1.toLowerCase() !== 'yes') {
      console.log('\n❌ Seeding cancelled.');
      rl.close();
      process.exit(0);
    }

    // Second confirmation
    console.log('');
    const confirm2 = await question('⚠️  Are you ABSOLUTELY sure? This is PRODUCTION! (type "SEED PRODUCTION"): ');
    
    if (confirm2 !== 'SEED PRODUCTION') {
      console.log('\n❌ Seeding cancelled. Confirmation text did not match.');
      rl.close();
      process.exit(0);
    }

    console.log('');
    console.log('🌱 Starting production database seeding...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Set the production DATABASE_URI
    process.env.DATABASE_URI = PRODUCTION_DB_URI;

    // Run the seed script
    execSync('bun run src/seed.ts', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URI: PRODUCTION_DB_URI
      }
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Production seeding completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Go to: https://toolbay.net/sign-in');
    console.log('  2. Login with: admin@toolbay.net / demo');
    console.log('  3. IMMEDIATELY change the password!');
    console.log('  4. Configure your admin tenant settings');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Seeding failed:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('  - Database connection failed');
    console.error('  - Data already exists (duplicate entries)');
    console.error('  - Network connectivity issues');
    console.error('  - Invalid database credentials');
    console.error('');
  } finally {
    rl.close();
  }
}

confirmAndSeed();
