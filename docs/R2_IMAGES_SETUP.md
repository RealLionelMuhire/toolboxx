# Cloudflare R2 Images Setup

If product images are not displaying after migrating to Cloudflare R2, check:

## 1. Enable Public Access on R2 Bucket

R2 buckets are **private by default**. You must enable public access:

1. Cloudflare Dashboard → **R2** → select your bucket
2. **Settings** → **Public access**
3. Under **Public Development URL** → click **Enable**
4. In **Allow Public Access?** → type `allow` and click **Allow**
5. Copy the **Public Bucket URL** (e.g. `https://pub-xxxxx.r2.dev`)

## 2. Environment Variables

Ensure `.env` has:

```env
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev   # From step 1 - no trailing slash
S3_BUCKET=your_bucket_name
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_REGION=auto
```

## 3. Run Migration (if coming from Vercel Blob)

If you had media in Vercel Blob, run the migration script to copy files to R2 and update DB URLs:

```bash
bun run storage:migrate
```

**If images show 404 after migration** (e.g. `helmets.jpeg` not found but `68ffe305-helmets.jpeg` exists in R2), the Media `filename` field may be wrong. Run:

```bash
bun run storage:fix-filenames
```

This updates `filename` to match the actual R2 object key (`{id}-{name}.ext`).

## 4. Custom Domain (optional)

If using an R2 custom domain (e.g. `cdn.yourdomain.com`):

- Set `R2_PUBLIC_URL=https://cdn.yourdomain.com` (no trailing slash)
- The app will allow this hostname in `next.config.mjs` automatically

## 5. Fast loading (Cache-Control)

R2 objects have no Cache-Control by default, so CDN/browsers don't cache aggressively. Vercel Blob did this automatically.

Add Cache-Control to all media for fast loads:

```bash
bun run storage:add-cache-control
```

This sets `Cache-Control: public, max-age=31536000, immutable` on all R2 objects. Run once after migration, and optionally after bulk uploads.

## 6. Verify URLs

Check a Media document in MongoDB. The `url` field should look like:

- `https://pub-xxxxx.r2.dev/media/filename.jpg` (r2.dev)
- Or `https://cdn.yourdomain.com/media/filename.jpg` (custom domain)

Open a URL directly in the browser. If you get **401 Unauthorized**, public access is not enabled on the bucket.
