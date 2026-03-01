# Storage Migration Analysis: Vercel Blob → Free Alternative

**Goal:** Migrate from Vercel Blob to a reliable, fully free alternative without losing any data.

---

## 1. Current State

### What's stored in Vercel Blob

| Collection / Usage | Storage Path | Notes |
|--------------------|--------------|-------|
| **Media** | Primary storage | Product images, tenant logos, RDB certificates, tender/bid documents |
| **Products** | `image`, `cover`, `gallery` → media | References Media by ID |
| **Tenants** | `image`, `rdbCertificate` → media | Store logos, verification docs |
| **Tenders** | `documents[].file` → media | Specs, terms, drawings |
| **TenderBids** | `documents[].file` → media | Quotes, proposals |
| **Messages** | Possibly attachments → media | Chat attachments |

All files flow through the **Media** collection. MongoDB stores:
- `url` — points to `https://*.public.blob.vercel-storage.com/...`
- `filename`, `mimeType`, `filesize`, `width`, `height`, etc.

### Env var in use

- `BLOB_READ_WRITE_TOKEN` — used in `src/payload.config.ts` by `vercelBlobStorage`

---

## 2. Free Alternatives Compared

| Provider | Free Tier | Egress | Payload Adapter | Reliability | Notes |
|----------|-----------|--------|-----------------|-------------|-------|
| **Cloudflare R2** | 10 GB storage, 1M writes, 10M reads/mo | **Free** | `@payloadcms/storage-s3` (S3 API) | ⭐⭐⭐⭐⭐ | Best option: no egress fees |
| **Backblaze B2** | 10 GB storage | 3× storage free | `@payloadcms/storage-s3` (S3 API) | ⭐⭐⭐⭐ | Solid, S3-compatible |
| **Uploadthing** | 2 GB | Included | `@payloadcms/storage-uploadthing` | ⭐⭐⭐ | Limited free tier |
| **Supabase Storage** | 1 GB | 2 GB/mo | ❌ No adapter | — | Not usable today |
| **AWS S3** | 5 GB (12 mo) | 15 GB/mo (12 mo) | `@payloadcms/storage-s3` | ⭐⭐⭐⭐ | Free tier expires |

### Recommendation: **Cloudflare R2**

- 10 GB free storage
- Free egress
- S3-compatible → use `@payloadcms/storage-s3`
- Strong CDN and reliability
- No time-limited free tier

---

## 3. Migration Strategy (Zero Data Loss)

### Phase 1: Audit

1. **Count media records** — how many files and total size?
2. **List all Vercel Blob URLs** — via `list()` from `@vercel/blob` or from MongoDB `media` collection.
3. **Confirm URLs match** — ensure every Media doc has a valid Vercel Blob URL.

### Phase 2: Setup New Storage

1. Create Cloudflare R2 bucket.
2. Create R2 API token (Object Read & Write).
3. Enable public access: Bucket → Settings → Public access → Allow Access → R2 dev subdomain. Copy the URL (e.g. `https://pub-xxxxx.r2.dev`).
4. Add env vars:
   - `S3_BUCKET`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_ENDPOINT` (R2 S3 API endpoint)
   - `S3_REGION=auto`
   - `R2_PUBLIC_URL` (from step 3)

### Phase 3: Migration Script

Run: `bun run storage:migrate`

The script copies (does not delete) each file from Vercel Blob to R2 and updates the media URL in MongoDB.

**Important:** Run migration in a controlled way (e.g. maintenance window) so no new uploads happen during migration.

### Phase 4: Switch Payload Config

1. Replace `vercelBlobStorage` with `s3Storage` (R2 config).
2. Update `next.config.mjs` `remotePatterns` to allow R2 URLs.
3. Update admin `importMap.js` if needed for client uploads.
4. Remove `BLOB_READ_WRITE_TOKEN` from env.

### Phase 5: Validation

1. Spot-check URLs (products, tenants, tenders, bids).
2. Confirm images load in admin and storefront.
3. Test new uploads.
4. Keep Vercel Blob data for a while before deleting.

---

## 4. What We Need to Decide

### A. Storage provider

- **Cloudflare R2** — recommended (10 GB, free egress).
- **Backblaze B2** — alternative if you prefer B2.

### B. Current data volume

- Do you know how many media files and total size you have?
- If &lt; 10 GB → R2 free tier is enough.
- If &gt; 10 GB → consider Backblaze B2 or splitting (e.g. old vs new storage).

### C. Migration timing

- **Option A:** One-time migration script (recommended).
- **Option B:** Dual-write during transition (more complex, higher risk).

### D. R2 public vs private

- **Public:** Direct CDN URLs, simpler, matches current Vercel Blob behavior.
- **Private:** Presigned URLs, more control, slightly more setup.

---

## 5. Next Steps

1. **Audit:** Run a script to count media docs and total size.
2. **Choose provider:** Confirm R2 (or B2).
3. **Create R2 bucket** and API token.
4. **Implement migration script** (Node/TS).
5. **Test** on staging or a copy of prod data.
6. **Run migration** on production.
7. **Switch Payload** to R2 and validate.
8. **Retire** Vercel Blob after a grace period.

---

## 6. Files to Modify (When Implementing)

| File | Changes |
|------|---------|
| `src/payload.config.ts` | Replace `vercelBlobStorage` with `s3Storage` (R2 config) |
| `next.config.mjs` | Add R2 CDN URL to `remotePatterns` |
| `package.json` | Add `@payloadcms/storage-s3`, remove `@payloadcms/storage-vercel-blob` |
| `src/app/(payload)/admin/importMap.js` | Swap Vercel Blob client handler for S3/R2 |
| `.env.example` | Replace `BLOB_READ_WRITE_TOKEN` with R2/S3 vars |
| New: `scripts/migrate-blob-to-r2.ts` | Migration script |

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss | Download from Vercel first, verify, then upload to R2 |
| Broken URLs | Update MongoDB only after successful R2 upload |
| Downtime | Run migration during low traffic; keep Vercel Blob until validated |
| Wrong file mapping | Use Media `id` and `url` as source of truth; validate each file |

---

*Document created for migration planning. Update as decisions are made.*
