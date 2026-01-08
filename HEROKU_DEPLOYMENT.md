# Heroku Deployment Guide

## ✅ Pre-Deployment Checklist

Your project is now configured for Heroku deployment with the following:
- ✅ Procfile configured to use custom server.js
- ✅ Standalone output mode in next.config.mjs
- ✅ Node.js version specified in package.json
- ✅ Custom server.js with PORT environment variable support

## 🚀 Deployment Steps

### 1. Install Heroku CLI
```bash
# If not already installed
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Login to Heroku
```bash
heroku login
```

### 3. Create Heroku App
```bash
heroku create your-app-name
# Or let Heroku generate a name:
heroku create
```

### 4. Add MongoDB Addon (Optional)
If you want to use Heroku's MongoDB addon instead of your Atlas cluster:
```bash
heroku addons:create mongolab:sandbox
```

### 5. Configure Environment Variables
You need to set ALL environment variables from your .env file:

```bash
# Database
heroku config:set DATABASE_URI="your_mongodb_uri"
heroku config:set PAYLOAD_SECRET="your_secret_key"

# App Configuration
heroku config:set NEXT_PUBLIC_APP_URL="https://your-app-name.herokuapp.com"
heroku config:set NEXT_PUBLIC_ROOT_DOMAIN="your-app-name.herokuapp.com"
heroku config:set NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING="false"

# Stripe
heroku config:set STRIPE_SECRET_KEY="your_stripe_secret_key"
heroku config:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_public_key"
heroku config:set STRIPE_WEBHOOK_SECRET="your_webhook_secret"

# Vercel Blob (for file storage)
heroku config:set BLOB_READ_WRITE_TOKEN="your_blob_token"

# Web Push Notifications
heroku config:set NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_vapid_public_key"
heroku config:set VAPID_PRIVATE_KEY="your_vapid_private_key"
heroku config:set VAPID_EMAIL="your_email"

# SMTP Email
heroku config:set SMTP_HOST="smtp.gmail.com"
heroku config:set SMTP_PORT="587"
heroku config:set SMTP_USER="your_email"
heroku config:set SMTP_PASS="your_app_password"
heroku config:set SMTP_FROM_EMAIL="your_from_email"
heroku config:set SMTP_FROM_NAME="Your App Name"

# Resend API
heroku config:set RESEND_API_KEY="your_resend_key"

# Node Environment
heroku config:set NODE_ENV="production"
```

### 6. Set Buildpack
Heroku should auto-detect Node.js, but you can explicitly set it:
```bash
heroku buildpacks:set heroku/nodejs
```

### 7. Deploy
```bash
git push heroku main
# Or if your branch is named differently:
git push heroku your-branch:main
```

### 8. Scale Dynos
```bash
# Ensure at least one web dyno is running
heroku ps:scale web=1
```

### 9. Open Your App
```bash
heroku open
```

## 📊 Monitoring & Logs

### View Logs
```bash
# Real-time logs
heroku logs --tail

# Last 1500 lines
heroku logs -n 1500

# Only app logs (no router logs)
heroku logs --source app
```

### Check Dyno Status
```bash
heroku ps
```

### Restart App
```bash
heroku restart
```

## ⚠️ Important Notes

### 1. Database Connection
- Use your **production MongoDB URI** (currently in PRO_DATABASE_URI)
- Ensure MongoDB Atlas allows Heroku's IP addresses (or enable "Allow access from anywhere" for 0.0.0.0/0)

### 2. File Storage
- Your app uses Vercel Blob for file storage
- Ensure BLOB_READ_WRITE_TOKEN is set correctly
- Consider alternative storage solutions like AWS S3 or Cloudinary if needed

### 3. Subdomain Routing
- Heroku's free/hobby dynos don't support custom domain routing easily
- Set `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING="false"` for Heroku
- For custom domains, you'll need a paid dyno and configure DNS

### 4. Build Time
- Next.js builds can take 5-10 minutes on Heroku
- Free dyno sleeps after 30 minutes of inactivity (first request will be slow)

### 5. Webhook Configuration
- Update your Stripe webhook URL to: `https://your-app-name.herokuapp.com/api/webhooks/stripe`
- Get new webhook secret from Stripe dashboard
- Update STRIPE_WEBHOOK_SECRET in Heroku config

## 🔧 Troubleshooting

### Build Fails
```bash
# Check build logs
heroku logs --tail

# Try local build first
npm run build

# Clear build cache
heroku repo:purge_cache -a your-app-name
git commit --allow-empty -m "Purge cache"
git push heroku main
```

### App Crashes
```bash
# Check error logs
heroku logs --tail --source app

# Check dyno status
heroku ps

# Restart
heroku restart
```

### Database Connection Issues
```bash
# Test if MongoDB URI is set
heroku config:get DATABASE_URI

# Check MongoDB Atlas network access
# Go to MongoDB Atlas → Network Access → Add your Heroku app IPs or 0.0.0.0/0
```

### Memory Issues
- Free dynos have 512MB RAM limit
- Consider upgrading to Hobby dyno ($7/month) with 1GB RAM
```bash
heroku ps:resize web=hobby
```

## 💰 Cost Considerations

- **Free Dyno**: Sleeps after 30 min inactivity, 550-1000 hours/month
- **Hobby Dyno**: $7/month, never sleeps
- **Standard/Performance**: $25+/month, more resources and features

## 🔄 Continuous Deployment

### GitHub Integration
1. Go to Heroku Dashboard
2. Select your app
3. Deploy tab → Connect to GitHub
4. Enable "Automatic deploys" from main branch
5. Enable "Wait for CI to pass" if you have tests

## 📝 Post-Deployment Tasks

- [ ] Update NEXT_PUBLIC_APP_URL in all places it's referenced
- [ ] Configure Stripe webhooks with new URL
- [ ] Test email sending functionality
- [ ] Test payment flows
- [ ] Test file uploads
- [ ] Monitor error rates in Heroku logs
- [ ] Set up custom domain (if using paid dyno)
- [ ] Configure SSL (automatic with Heroku)

## 🎯 Quick Deploy Command
```bash
# One-liner to deploy
git add . && git commit -m "Deploy to Heroku" && git push heroku main && heroku logs --tail
```
