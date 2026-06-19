#!/usr/bin/env node

/**
 * Migration Script: Auto-verify all existing users
 *
 * Sets emailVerified = true for all users who don't have it set yet.
 * Ensures backward compatibility — existing users won't need to re-verify.
 * Run this ONCE before enforcing email verification on login.
 *
 * Run: node scripts/auto-verify-existing-users.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also try .env.production if .env doesn't have DATABASE_URI
if (!process.env.DATABASE_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
}

const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error('❌ DATABASE_URI is not set. Check your .env or .env.production file.');
  process.exit(1);
}

async function autoVerifyExistingUsers() {
  console.log('🚀 Starting migration: Auto-verify existing users...\n');

  const client = new MongoClient(DATABASE_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find all users that are not yet verified
    const unverifiedUsers = await usersCollection.find({
      $or: [
        { emailVerified: { $exists: false } },
        { emailVerified: false },
        { emailVerified: null },
      ],
    }).toArray();

    console.log(`📊 Found ${unverifiedUsers.length} users to verify\n`);

    if (unverifiedUsers.length === 0) {
      console.log('✨ All users are already verified. Nothing to do.\n');
      return;
    }

    // Bulk update — set emailVerified = true, clear any pending tokens
    const result = await usersCollection.updateMany(
      {
        $or: [
          { emailVerified: { $exists: false } },
          { emailVerified: false },
          { emailVerified: null },
        ],
      },
      {
        $set: { emailVerified: true },
        $unset: { verificationToken: '', verificationExpires: '' },
      }
    );

    console.log('📈 Migration Summary:');
    console.log(`   ✅ Users verified: ${result.modifiedCount}`);
    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

autoVerifyExistingUsers();
