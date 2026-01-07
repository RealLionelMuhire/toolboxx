# Railway Deployment Guide

## Prerequisites

Before deploying to Railway, ensure you have the following environment variables configured in your Railway project:

### Required Environment Variables

```bash
# Database
DATABASE_URI=mongodb+srv://your-mongodb-connection-string

# Payload CMS
PAYLOAD_SECRET=your-secure-random-secret-here
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Optional but recommended
NODE_ENV=production
```

## Deployment Steps

1. **Connect your GitHub repository to Railway**
2. **Set all required environment variables** in Railway dashboard
3. **Deploy** - Railway will automatically:
   - Detect the Dockerfile
   - Build the Docker image using Bun for faster builds
   - Run the standalone Next.js server
   - Perform health checks on `/api/health`

## Troubleshooting

### Health Check Failures

If health checks fail with "service unavailable":

1. **Check logs** in Railway dashboard for startup errors
2. **Verify environment variables** - missing DATABASE_URI or PAYLOAD_SECRET will cause startup failures
3. **Check MongoDB connection** - ensure your MongoDB cluster allows connections from Railway's IP addresses
4. **Increase timeout** - The `railway.json` file sets a 300-second timeout for health checks

### Common Issues

- **Port binding**: Railway automatically provides a `PORT` environment variable. The app will use this port.
- **Build failures**: Check if `bun.lock` is committed to the repository
- **MongoDB timeouts**: Ensure MongoDB connection string includes `retryWrites=true&w=majority`
- **Memory issues**: Railway's free tier has memory limits. Upgrade if needed.

## Railway Configuration

The deployment is configured in `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

## Docker Build Process

1. **deps stage**: Install dependencies using Bun (faster than npm)
2. **builder stage**: Build Next.js with standalone output
3. **runner stage**: Copy standalone artifacts and run with Node.js

## Monitoring

- Health checks run every few seconds on `/api/health`
- Railway provides automatic restarts on failure
- Maximum 10 restart attempts before marking as failed

## Support

If deployment continues to fail:
1. Check Railway logs for specific error messages
2. Verify all environment variables are set correctly
3. Test MongoDB connection from Railway's network
4. Ensure Vercel Blob and Resend API keys are valid
