#!/usr/bin/env node
/**
 * Audit script: Media storage usage (Vercel Blob)
 *
 * Run: node scripts/audit-media-storage.mjs
 * Requires: DATABASE_URI in .env
 *
 * Outputs:
 * - Total media count
 * - Total storage size (bytes / MB)
 * - URL breakdown (domain distribution)
 * - Sample of media records
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error('DATABASE_URI is not set in .env');
  process.exit(1);
}

async function audit() {
  const client = new MongoClient(DATABASE_URI);

  try {
    await client.connect();
    const db = client.db();
    const mediaCollection = db.collection('media');

    const total = await mediaCollection.countDocuments();
    const cursor = mediaCollection.find({}, { projection: { url: 1, filename: 1, filesize: 1, mimeType: 1 } });

    let totalBytes = 0;
    const domainCounts = {};
    const sample = [];
    let i = 0;

    for await (const doc of cursor) {
      if (doc.filesize) totalBytes += doc.filesize;

      if (doc.url) {
        try {
          const u = new URL(doc.url);
          const domain = u.hostname;
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        } catch {
          domainCounts['(invalid-url)'] = (domainCounts['(invalid-url)'] || 0) + 1;
        }
      } else {
        domainCounts['(no-url)'] = (domainCounts['(no-url)'] || 0) + 1;
      }

      if (i < 5) {
        sample.push({ id: doc._id, filename: doc.filename, url: doc.url?.slice(0, 60) + '...', filesize: doc.filesize });
        i++;
      }
    }

    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

    console.log('\n=== Media Storage Audit (Vercel Blob) ===\n');
    console.log(`Total media documents: ${total}`);
    console.log(`Total size (from filesize): ${totalBytes} bytes (~${totalMB} MB)`);
    console.log('\nURL domain breakdown:');
    Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([d, c]) => console.log(`  ${d}: ${c}`));
    console.log('\nSample records:');
    sample.forEach((s) => console.log(`  - ${s.filename} (${s.filesize} bytes)`));
    console.log('\nR2 free tier: 10 GB. Current usage: ~' + totalMB + ' MB');
    if (parseFloat(totalMB) > 10 * 1024) {
      console.log('  ⚠️  Exceeds R2 free tier. Consider Backblaze B2 or splitting storage.');
    } else {
      console.log('  ✅ Within R2 free tier.');
    }
    console.log('\n');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

audit();
