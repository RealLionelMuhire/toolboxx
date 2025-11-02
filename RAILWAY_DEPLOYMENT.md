# Railway Deployment Guide

## Issues Fixed

### 1. Missing `aws4` Dependency
The MongoDB driver used by Payload CMS requires the `aws4` package for AWS authentication features. This has been added to `package.json`.

### 2. Stripe Initialization Error
The Stripe SDK was being initialized at module load time, which caused build failures when environment variables weren't available during the build phase. This has been fixed with lazy initialization.

## Required Environment Variables

Make sure to set these in your Railway project settings:

### Database
- `DATABASE_URI` - Your MongoDB connection string
- `PAYLOAD_SECRET` - A secure random string for Payload CMS encryption (generate with `openssl rand -base64 32`)

### Application URLs
- `NEXT_PUBLIC_APP_URL` - Your Railway app URL (e.g., `https://your-app.up.railway.app`)
- `NEXT_PUBLIC_ROOT_DOMAIN` - Your root domain (e.g., `your-app.up.railway.app`)
- `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING` - Set to `"false"` unless using custom domain with subdomains

### Stripe
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (starts with `whsec_`)

### Vercel Blob Storage
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob storage token

## Deployment Steps

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Environment Variables
In Railway dashboard:
1. Go to your project
2. Click on "Variables" tab
3. Add all required environment variables listed above

### 3. Deploy
Railway will automatically deploy when you push to your connected Git repository.

Or manually trigger a deployment:
```bash
railway up
```

## Build Configuration

The project uses the following build configuration (defined in `railway.json`):

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bun install && bun run build"
  },
  "deploy": {
    "startCommand": "bun run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Verifying the Deployment

1. Check Railway logs for any errors
2. Visit your app URL
3. Test the Stripe webhook by creating a test order
4. Verify file uploads work with Vercel Blob storage

## Troubleshooting

### Build Fails with "aws4" Error
- Ensure you've run `bun install` to install the newly added `aws4` dependency
- Check that your `package.json` includes `"aws4": "^1.13.2"` in dependencies

### Build Fails with Stripe Error
- Ensure all Stripe environment variables are set in Railway
- The code now handles missing env vars during build gracefully
- If you see warnings about STRIPE_SECRET_KEY during build, this is expected and safe

### Runtime Errors
- Check Railway logs: `railway logs`
- Verify all environment variables are correctly set
- Ensure your MongoDB connection string is correct and accessible from Railway

## Post-Deployment Tasks

1. Set up Stripe webhooks pointing to `https://your-app.up.railway.app/api/stripe/webhooks`
2. Test payment flow
3. Monitor Railway logs for any issues

## Notes

- Railway automatically restarts your app if it crashes (up to 10 times)
- Environment variables are encrypted and secure in Railway
- Make sure to use production Stripe keys for production deployments
