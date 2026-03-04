#!/usr/bin/env node
/**
 * Migration: Copy media from Vercel Blob (via Blob API) to Cloudflare R2
 *
 * Use this when /api/media/file/xxx returns 404 but files are still in Vercel Blob.
 * Fetches directly from Blob API instead of Payload endpoint.
 *
 * Requires:
 *   BLOB_READ_WRITE_TOKEN (uncomment in .env or pass env)
 *   DATABASE_URI, S3_*, R2_PUBLIC_URL
 *
 * Run: BLOB_READ_WRITE_TOKEN="your_token" bun run storage:migrate-blob-api
 * Or: uncomment BLOB_READ_WRITE_TOKEN in .env, then bun run storage:migrate-blob-api
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { list, get } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URI = process.env.DATABASE_URI;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || 'auto';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

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
  console.error('Missing R2_PUBLIC_URL');
  process.exit(1);
}
if (!BLOB_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN. Uncomment in .env or run: BLOB_READ_WRITE_TOKEN="..." bun run storage:migrate-blob-api');
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

    // 1. List all blobs from Vercel Blob
    console.log('Listing blobs from Vercel Blob...');
    const blobs = [];
    let cursor;
    do {
      const result = await list({ cursor, limit: 1000, token: BLOB_TOKEN });
      blobs.push(...result.blobs);
      cursor = result.cursor;
    } while (cursor);
    console.log(`Found ${blobs.length} blobs in Vercel Blob`);

    if (blobs.length === 0) {
      console.log('No blobs in Vercel Blob. Nothing to migrate.');
      return;
    }

    // 2. Build map: filename -> blob (pathname often ends with filename)
    const blobByFilename = new Map();
    for (const blob of blobs) {
      const base = blob.pathname.split('/').pop() || blob.pathname;
      blobByFilename.set(base, blob);
      blobByFilename.set(blob.pathname, blob);
    }

    // 3. Process ALL media docs - try to find matching blob and migrate to R2
    // (Filter was excluding docs with non-standard url formats; blob matching handles skips)
    const mediaDocs = await mediaCollection.find({}).toArray();

    console.log(`Media docs to process: ${mediaDocs.length}`);

    let ok = 0;
    let skip = 0;
    let fail = 0;

    async function checkR2Exists(key) {
      try {
        const url = `${R2_PUBLIC_URL}/${key}`;
        const res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { Accept: 'image/*,*/*' } });
        return res.ok;
      } catch {
        return false;
      }
    }

    for (const doc of mediaDocs) {
      const id = doc._id.toString();
      const rawFilename = doc.filename || doc.url?.split('/').pop()?.split('?')[0] || 'unknown';
      const filename = rawFilename.startsWith(id) ? rawFilename.split('-').slice(1).join('-') || rawFilename : rawFilename;
      const r2Key = `media/${id}-${filename}`;

      // Skip if already in R2 with correct key
      if (await checkR2Exists(r2Key)) {
        const storedFilename = `${id}-${filename}`;
        if (doc.filename !== storedFilename || !doc.url?.includes(r2Key)) {
          await mediaCollection.updateOne(
            { _id: doc._id },
            { $set: { url: `${R2_PUBLIC_URL}/${r2Key}`, filename: storedFilename } }
          );
          console.log(`✅ Fixed doc only: ${filename} (already in R2)`);
          ok++;
        } else {
          skip++;
        }
        continue;
      }

      // Find matching blob (by base filename)
      const blob = blobByFilename.get(filename) || blobByFilename.get(rawFilename) || blobByFilename.get(`${id}-${filename}`);
      if (!blob) {
        if (skip < 5) console.log(`⏭️  Skip ${id}: no matching blob for ${filename}`);
        skip++;
        continue;
      }

      try {
        const access = blob.url?.includes('.private.') ? 'private' : 'public';
        const blobData = await get(blob.url, { access, token: BLOB_TOKEN });
        if (!blobData) {
          throw new Error('Blob get returned null');
        }
        const chunks = [];
        for await (const chunk of blobData.stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const contentType = doc.mimeType || blobData.headers?.get?.('content-type') || 'application/octet-stream';

        const key = `media/${id}-${filename}`;

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
        const storedFilename = `${id}-${filename}`;

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
