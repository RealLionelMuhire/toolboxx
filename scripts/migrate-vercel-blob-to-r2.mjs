#!/usr/bin/env node
/**
 * Migration: Copy media from Vercel Blob to Cloudflare R2
 *
 * - Downloads each file from Vercel Blob URL
 * - Uploads to R2
 * - Updates MongoDB media doc with new R2 URL
 * - Does NOT delete from Vercel (copy only)
 *
 * Requires in .env:
 *   DATABASE_URI, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 *   S3_ENDPOINT, S3_REGION=auto, R2_PUBLIC_URL (e.g. https://pub-xxx.r2.dev)
 *
 * Run: node scripts/migrate-vercel-blob-to-r2.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URI = process.env.DATABASE_URI;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || 'auto';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''); // no trailing slash

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

requireEnv('DATABASE_URI');
requireEnv('S3_BUCKET');
requireEnv('S3_ACCESS_KEY_ID');
requireEnv('S3_SECRET_ACCESS_KEY');
requireEnv('S3_ENDPOINT');
if (!R2_PUBLIC_URL) {
  console.error('Missing R2_PUBLIC_URL (from Cloudflare bucket Settings > Public access > R2 dev subdomain)');
  process.exit(1);
}

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function migrate() {
  const client = new MongoClient(DATABASE_URI);

  try {
    await client.connect();
    const db = client.db();
    const mediaCollection = db.collection('media');

    const cursor = mediaCollection.find({});
    const docs = await cursor.toArray();

    let ok = 0;
    let skip = 0;
    let fail = 0;

    for (const doc of docs) {
      const id = doc._id.toString();
      const filename = doc.filename || 'unknown';
      const url = doc.url;

      if (!url || !url.includes('blob.vercel-storage.com')) {
        console.log(`⏭️  Skip ${id}: no Vercel Blob URL`);
        skip++;
        continue;
      }

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = doc.mimeType || res.headers.get('content-type') || 'application/octet-stream';

        const key = `media/${doc._id}-${filename}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );

        const newUrl = `${R2_PUBLIC_URL}/${key}`;
        const storedFilename = `${doc._id}-${filename}`;

        await mediaCollection.updateOne(
          { _id: doc._id },
          { $set: { url: newUrl, filename: storedFilename } }
        );

        console.log(`✅ ${filename} → R2`);
        ok++;
      } catch (err) {
        console.error(`❌ ${id} (${filename}): ${err.message}`);
        fail++;
      }
    }

    console.log('\n=== Done ===');
    console.log(`Migrated: ${ok}`);
    console.log(`Skipped:  ${skip}`);
    console.log(`Failed:   ${fail}`);
  } finally {
    await client.close();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
