#!/usr/bin/env node
/**
 * Fix R2 media docs with broken URLs (404).
 * Payload uses generateFileURL({ filename }) -> R2_PUBLIC_URL/media/{filename}.
 * R2 objects are stored at media/{id}-{originalFilename}.
 * Docs with filename "IMG.jpg" produce wrong URL media/IMG.jpg (404).
 * This script fixes filename to "{id}-IMG.jpg" so the URL matches R2.
 *
 * Processes ALL media docs (not just those with r2 URLs in the stored url field).
 *
 * Run: node scripts/fix-r2-broken-urls.mjs
 * Or: bun run storage:fix-broken-urls
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URI = process.env.DATABASE_URI;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!DATABASE_URI) {
  console.error('Missing DATABASE_URI');
  process.exit(1);
}
if (!R2_PUBLIC_URL) {
  console.error('Missing R2_PUBLIC_URL');
  process.exit(1);
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; Toolboxx-Migration/1.0)',
      },
      redirect: 'follow',
    });
    return res.status;
  } catch (err) {
    return 0;
  }
}

async function fix() {
  const client = new MongoClient(DATABASE_URI);
  try {
    await client.connect();
    const db = client.db();
    const mediaCollection = db.collection('media');

    const allDocs = await mediaCollection.find({}).toArray();
    const totalMedia = allDocs.length;

    console.log(`Total media docs: ${totalMedia}`);

    let fixed = 0;
    let skippedOk = 0;
    let needsMigration = 0;

    for (const doc of allDocs) {
      const id = doc._id.toString();
      const currentFilename = (doc.filename || '').trim() || 'unknown';

      // Correct R2 key format: media/{id}-{originalFilename}
      const correctFilename = currentFilename.startsWith(id)
        ? currentFilename
        : `${id}-${currentFilename}`;
      const correctUrl = `${R2_PUBLIC_URL}/media/${correctFilename}`;

      const status = await checkUrl(correctUrl);
      if (status === 200) {
        if (currentFilename !== correctFilename) {
          await mediaCollection.updateOne(
            { _id: doc._id },
            { $set: { url: correctUrl, filename: correctFilename } }
          );
          console.log(`✅ Fixed: ${currentFilename} → ${correctFilename}`);
          fixed++;
        } else {
          // Already correct
          skippedOk++;
        }
        continue;
      }

      // Object not found at correct path - needs migration from Vercel Blob first
      if (status === 404) {
        needsMigration++;
        if (needsMigration <= 5) {
          console.log(`⏳ Needs migration: ${id} (${currentFilename}) - run storage:migrate-blob-api first`);
        }
      }
    }

    if (needsMigration > 5) {
      console.log(`⏳ ... and ${needsMigration - 5} more need migration`);
    }

    console.log('\n=== Done ===');
    console.log(`Fixed:           ${fixed}`);
    console.log(`Skipped (OK):    ${skippedOk}`);
    if (needsMigration > 0) {
      console.log(`Needs migration: ${needsMigration} (run: bun run storage:migrate-blob-api)`);
    }
  } finally {
    await client.close();
  }
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
