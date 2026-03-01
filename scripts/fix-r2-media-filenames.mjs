#!/usr/bin/env node
/**
 * Fix Media documents that were migrated to R2 with correct url but wrong filename.
 * Payload's generateFileURL uses `filename` - if it's "helmets.jpeg" instead of
 * "68ffe30540c19f3fbf514507-helmets.jpeg", URLs break.
 *
 * This script updates filename to match the actual object key in R2 (extracted from url).
 *
 * Run: node scripts/fix-r2-media-filenames.mjs
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
  console.error('Missing DATABASE_URI');
  process.exit(1);
}

async function fix() {
  const client = new MongoClient(DATABASE_URI);
  try {
    await client.connect();
    const db = client.db();
    const mediaCollection = db.collection('media');

    const r2Docs = await mediaCollection.find({
      url: { $regex: /\.r2\.dev\// },
    }).toArray();

    let fixed = 0;
    for (const doc of r2Docs) {
      const url = doc.url;
      const currentFilename = doc.filename || '';
      const pathPart = url.replace(/^https?:\/\/[^/]+\//, '');
      const storedFilename = pathPart.includes('/') ? pathPart.split('/').pop() : pathPart;

      if (storedFilename && storedFilename !== currentFilename) {
        await mediaCollection.updateOne(
          { _id: doc._id },
          { $set: { filename: storedFilename } }
        );
        console.log(`Fixed: ${currentFilename} → ${storedFilename}`);
        fixed++;
      }
    }
    console.log(`\nUpdated ${fixed} media documents.`);
  } finally {
    await client.close();
  }
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
