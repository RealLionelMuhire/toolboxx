#!/usr/bin/env node
/**
 * Add Cache-Control to all R2 objects for fast CDN & browser caching.
 * Without this, R2 serves objects with no Cache-Control → every request can hit origin.
 * Vercel Blob sets strong cache headers; R2 does not by default.
 *
 * Uses CopyObject (copy to self) with MetadataDirective: REPLACE.
 *
 * Run: node scripts/add-r2-cache-control.mjs
 * Or: bun run storage:add-cache-control
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || 'auto';

// 1 year - immutable-like for media; when you replace an image you use a new key
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

requireEnv('S3_BUCKET');
requireEnv('S3_ACCESS_KEY_ID');
requireEnv('S3_SECRET_ACCESS_KEY');
requireEnv('S3_ENDPOINT');

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function addCacheControl() {
  let count = 0;
  let continuationToken;

  do {
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: 'media/',
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of listRes.Contents || []) {
      const key = obj.Key;
      if (!key) continue;

      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
        const contentType = head.ContentType || 'application/octet-stream';

        await s3.send(
          new CopyObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            CopySource: `${S3_BUCKET}/${key}`,
            MetadataDirective: 'REPLACE',
            ContentType: contentType,
            CacheControl: CACHE_CONTROL,
          })
        );

        count++;
        if (count % 10 === 0 || count === 1) {
          console.log(`✅ ${count}: ${key}`);
        }
      } catch (err) {
        console.error(`❌ ${key}: ${err.message}`);
      }
    }

    continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`\nDone. Updated Cache-Control on ${count} objects.`);
}

addCacheControl().catch((err) => {
  console.error(err);
  process.exit(1);
});
