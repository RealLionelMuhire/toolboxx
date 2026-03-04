#!/usr/bin/env node
/**
 * Fix R2 media docs with broken URLs (404).
 * Some docs have url like .../media/1000320068.jpg but the actual R2 object
 * is at media/{id}-1000320068.jpg. This script detects 404s and fixes them.
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
    // Use GET: some CDNs (incl. R2) return 401 for HEAD but 200 for GET
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

    const totalMedia = await mediaCollection.countDocuments();
    // Match r2.dev OR custom domain from R2_PUBLIC_URL (e.g. cdn.example.com)
    const r2Host = R2_PUBLIC_URL ? new URL(R2_PUBLIC_URL).hostname : null;
    const r2Query = r2Host
      ? { $or: [{ url: { $regex: /\.r2\.dev\// } }, { url: { $regex: new RegExp(r2Host.replace(/\./g, "\\."), "i") } }] }
      : { url: { $regex: /\.r2\.dev\// } };
    const r2Docs = await mediaCollection.find(r2Query).toArray();

    console.log(`Total media docs: ${totalMedia}`);
    console.log(`R2 docs (url contains r2.dev or ${r2Host || "N/A"}): ${r2Docs.length}`);
    if (r2Docs.length === 0 && totalMedia > 0) {
      const sample = await mediaCollection.findOne({ url: { $exists: true, $ne: null } }, { url: 1, filename: 1 });
      console.log(`Sample URL format: ${sample?.url?.slice(0, 80) || "(none)"}...`);
    }

    let fixed = 0;
    let skippedOk = 0;
    let skippedErr = 0;

    for (const doc of r2Docs) {
      const id = doc._id.toString();
      const url = doc.url;
      const currentFilename = doc.filename || '';

      const status = await checkUrl(url);
      if (status === 200) {
        skippedOk++;
        continue;
      }

      if (status !== 404) {
        console.log(`⏭️  Skip ${id}: HTTP ${status}`);
        skippedErr++;
        continue;
      }

      // URL 404s. Try correct format: media/{id}-{filename}
      const basename = currentFilename.startsWith(id)
        ? currentFilename
        : `${id}-${currentFilename}`;
      const correctUrl = `${R2_PUBLIC_URL}/media/${basename}`;

      let correctStatus = await checkUrl(correctUrl);

      // If R2_PUBLIC_URL in .env differs from URL in doc (e.g. wrong bucket), try the doc's base
      const docBase = url.match(/^(https:\/\/[^/]+)/)?.[1];
      const altUrl = docBase ? `${docBase}/media/${basename}` : null;
      if (correctStatus !== 200 && altUrl && altUrl !== correctUrl) {
        correctStatus = await checkUrl(altUrl);
        if (correctStatus === 200) {
          await mediaCollection.updateOne(
            { _id: doc._id },
            { $set: { url: altUrl, filename: basename } }
          );
          console.log(`✅ Fixed (alt bucket): ${currentFilename} → ${basename}`);
          fixed++;
          continue;
        }
      }

      if (correctStatus === 200) {
        await mediaCollection.updateOne(
          { _id: doc._id },
          { $set: { url: correctUrl, filename: basename } }
        );
        console.log(`✅ Fixed: ${currentFilename} → ${basename}`);
        fixed++;
      } else {
        console.log(`❌ No fix for ${id} (${currentFilename}) - tried ${correctUrl} → ${correctStatus}`);
      }
    }

    console.log('\n=== Done ===');
    console.log(`Fixed:       ${fixed}`);
    console.log(`Skipped (OK): ${skippedOk}`);
    if (skippedErr > 0) {
      console.log(`Skipped (4xx/5xx): ${skippedErr}`);
    }
  } finally {
    await client.close();
  }
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
