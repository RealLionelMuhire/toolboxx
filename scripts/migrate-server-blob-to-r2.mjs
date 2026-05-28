#!/usr/bin/env node
/**
 * Migration: Copy media from Vercel Blob → Cloudflare R2 (server edition)
 *
 * Downloads every file from the server's Vercel Blob store, uploads to R2,
 * and updates MongoDB media docs with the new R2 URL.
 * Safe to re-run — already-migrated files are detected and skipped.
 *
 * Required .env vars:
 *   DATABASE_URI            — MongoDB Atlas connection string
 *   BLOB_READ_WRITE_TOKEN   — Vercel Blob token (read access)
 *   S3_BUCKET               — R2 bucket name (e.g. toolbay-media)
 *   S3_ACCESS_KEY_ID        — R2 API token Access Key ID
 *   S3_SECRET_ACCESS_KEY    — R2 API token Secret Access Key
 *   S3_ENDPOINT             — R2 S3-compatible endpoint URL
 *   S3_REGION               — always "auto" for R2
 *   R2_PUBLIC_URL           — public CDN URL for the bucket (https://pub-xxx.r2.dev)
 *
 * Run: node scripts/migrate-server-blob-to-r2.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { list } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Read from environment ────────────────────────────────────────────────────
function requireEnv(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing required env: ${name}`); process.exit(1); }
  return v;
}

const DATABASE_URI  = requireEnv('DATABASE_URI');
const BLOB_TOKEN    = requireEnv('BLOB_READ_WRITE_TOKEN');
const S3_BUCKET     = requireEnv('S3_BUCKET');
const S3_ACCESS_KEY = requireEnv('S3_ACCESS_KEY_ID');
const S3_SECRET     = requireEnv('S3_SECRET_ACCESS_KEY');
const S3_ENDPOINT   = requireEnv('S3_ENDPOINT');
const S3_REGION     = process.env.S3_REGION || 'auto';
const R2_PUBLIC_URL = requireEnv('R2_PUBLIC_URL').replace(/\/$/, '');
// ────────────────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET },
  forcePathStyle: true,
});

async function checkR2Exists(key) {
  try {
    const res = await fetch(`${R2_PUBLIC_URL}/${key}`, { method: 'GET', headers: { Accept: '*/*' } });
    return res.ok;
  } catch { return false; }
}

async function migrate() {
  const client = new MongoClient(DATABASE_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const mediaCollection = db.collection('media');

    // 1. List ALL blobs from Vercel Blob
    console.log('\n📦 Listing blobs from Vercel Blob...');
    const blobs = [];
    let cursor;
    do {
      const result = await list({ cursor, limit: 1000, token: BLOB_TOKEN });
      blobs.push(...result.blobs);
      cursor = result.cursor;
    } while (cursor);
    console.log(`   Found ${blobs.length} blobs`);

    if (blobs.length === 0) { console.log('Nothing to migrate.'); return; }

    // Build lookup maps by filename and pathname
    const blobByFilename = new Map();
    for (const blob of blobs) {
      const base = blob.pathname.split('/').pop() || blob.pathname;
      blobByFilename.set(base, blob);
      blobByFilename.set(blob.pathname, blob);
    }

    // 2. Load all media docs
    const mediaDocs = await mediaCollection.find({}).toArray();
    console.log(`\n🗃️  Media documents in MongoDB: ${mediaDocs.length}`);

    let ok = 0, skip = 0, fail = 0;

    for (const doc of mediaDocs) {
      const id = doc._id.toString();
      const rawFilename = doc.filename || 'unknown';
      const filename = rawFilename.startsWith(id)
        ? rawFilename.slice(id.length + 1) || rawFilename
        : rawFilename;
      const r2Key = `media/${id}-${filename}`;

      // Skip if already in R2
      if (await checkR2Exists(r2Key)) {
        const expectedUrl = `${R2_PUBLIC_URL}/${r2Key}`;
        if (doc.url !== expectedUrl) {
          await mediaCollection.updateOne({ _id: doc._id }, { $set: { url: expectedUrl, filename: `${id}-${filename}` } });
          console.log(`🔄 Fixed DB url (already in R2): ${filename}`);
        } else {
          console.log(`⏭️  Already in R2: ${filename}`);
        }
        skip++; continue;
      }

      // Find matching blob by filename
      const blob = blobByFilename.get(filename) || blobByFilename.get(rawFilename) || blobByFilename.get(`${id}-${filename}`);
      if (!blob) { console.log(`⏭️  No blob found for: ${filename}`); skip++; continue; }

      try {
        // Download from Vercel Blob using Bearer token (works for private blobs)
        const blobRes = await fetch(blob.url, { headers: { Authorization: `Bearer ${BLOB_TOKEN}` } });
        if (!blobRes.ok) throw new Error(`[VERCEL] HTTP ${blobRes.status} ${blobRes.statusText}`);

        const buffer = Buffer.from(await blobRes.arrayBuffer());
        const contentType = doc.mimeType || blobRes.headers.get('content-type') || 'application/octet-stream';

        // Upload to R2
        await s3.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: r2Key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }));

        // Update MongoDB doc
        await mediaCollection.updateOne(
          { _id: doc._id },
          { $set: { url: `${R2_PUBLIC_URL}/${r2Key}`, filename: `${id}-${filename}` } }
        );

        console.log(`✅ Migrated: ${filename}`);
        ok++;
      } catch (err) {
        console.error(`❌ Failed: ${filename} — ${err.message}`);
        if (err.Code) console.error(`   R2 code: ${err.Code}, HTTP: ${err.$metadata?.httpStatusCode}`);
        fail++;
      }
    }

    console.log('\n═══════════════════════════════');
    console.log(`✅ Migrated : ${ok}`);
    console.log(`⏭️  Skipped  : ${skip}`);
    console.log(`❌ Failed   : ${fail}`);
    console.log('═══════════════════════════════');
    if (fail > 0) console.log('\n⚠️  Re-run the script — it is safe to run multiple times.');
    else console.log('\n🎉 All done! You can now deploy the updated payload.config.ts (s3Storage).');

  } finally {
    await client.close();
  }
}

migrate().catch((err) => { console.error('\n💥 Fatal:', err.message); process.exit(1); });
