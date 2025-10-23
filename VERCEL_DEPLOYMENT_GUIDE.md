# Vercel Deployment Guide for Toolboxx

## ✅ Pre-Deployment Checklist

### 1. **Environment Variables** (CRITICAL)
You need to add these environment variables in Vercel Dashboard:

#### Required Variables:
```bash
# Database
DATABASE_URI=mongodb+srv://Leo:H4ckGeJLJANoaT6O@ticoai.wwfr4.mongodb.net/bythron-multitenant-ecommerce?retryWrites=true&w=majority&appName=TicoAI
PAYLOAD_SECRET=456dc321fa8e3861ecc2d373eed69a6100acd09717af063e3627e3247f0019a1

# Global - UPDATE THESE FOR PRODUCTION
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_ROOT_DOMAIN=your-app.vercel.app
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=false

# Stripe (if using)
STRIPE_SECRET_KEY=sk_test_51RSlvhQNXfgJjmVmcxDVOhMuaDDWalu5oRhb00tNkU4lVwd0ZXG8FhQf51qWrS0gxaSDSSaXcSrk1xsIofQWdr0d00cQUbS90h
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RSlvhQNXfgJjmVmbxbORXTE4HHf9lBjtnokeXxem6ZaWlTO8Ifhti9MMc2N4wdCEOIGbjNZudVwVp6WdWDOljXE00WIlFINpT
STRIPE_WEBHOOK_SECRET=whsec_da810d29c67c2955ae27246f4d3f2566eb2eedbe4570e478c6ebda9285a447d5

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_6kNCUzbOZ1FD48Ln_jx0qCmTcSGiaW4RJLLnc3vUO7pmehT

# Optional - Node Environment
NODE_ENV=production
```

### 2. **Update Production URLs**
After deploying, update these variables with your actual Vercel URL:
- `NEXT_PUBLIC_APP_URL` → Your Vercel URL (e.g., `https://toolboxx.vercel.app`)
- `NEXT_PUBLIC_ROOT_DOMAIN` → Your domain (e.g., `toolboxx.vercel.app`)

### 3. **Build Configuration**
Vercel should auto-detect these settings, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `bun install` or `npm install`
- **Node Version**: 20.x or higher

### 4. **Files Already Configured** ✅
- ✅ `.gitignore` - Properly excludes `.env`, `node_modules`, etc.
- ✅ `next.config.ts` - Optimized for production
- ✅ PayloadCMS configured for MongoDB
- ✅ Vercel Blob storage configured
- ✅ Authentication cookies fixed for production

---

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Project**
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (leave as default)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from the list above
   - Apply to: Production, Preview, Development

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables

---

## ⚠️ Important Post-Deployment Steps

### 1. **Update Environment Variables**
After first deployment, get your Vercel URL and update:
```bash
NEXT_PUBLIC_APP_URL=https://your-actual-url.vercel.app
NEXT_PUBLIC_ROOT_DOMAIN=your-actual-url.vercel.app
```

### 2. **Test Critical Features**
- ✅ Login/Authentication
- ✅ Product listing
- ✅ Image uploads (Vercel Blob)
- ✅ Mobile Money payments
- ✅ Order creation
- ✅ PayloadCMS admin panel (`/admin`)

### 3. **MongoDB Atlas Setup**
Ensure MongoDB Atlas allows Vercel IPs:
- Go to MongoDB Atlas → Network Access
- Either:
  - Add `0.0.0.0/0` (allow all - easier but less secure)
  - Or add specific Vercel IP ranges

### 4. **Custom Domain (Optional)**
If you have a custom domain:
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Update environment variables with your custom domain

### 5. **Stripe Webhooks (If Using Stripe)**
Update webhook URL in Stripe Dashboard:
- Old: `http://localhost:3000/api/stripe/webhooks`
- New: `https://your-app.vercel.app/api/stripe/webhooks`

---

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all environment variables are set
- Try building locally: `bun run build`

### Database Connection Issues
- Verify `DATABASE_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure MongoDB allows connections from Vercel

### Authentication Issues
- Verify `PAYLOAD_SECRET` is set
- Check cookie settings are working (already fixed in code)
- Ensure `NEXT_PUBLIC_APP_URL` matches your deployment URL

### Image Upload Issues
- Verify `BLOB_READ_WRITE_TOKEN` is set correctly
- Check Vercel Blob storage quota
- Test with small images first

---

## 📝 Recommended Next Steps After Deployment

1. **Set up monitoring** - Enable Vercel Analytics
2. **Configure domains** - Add custom domain if you have one
3. **Enable HTTPS** - Vercel provides automatic SSL
4. **Set up staging environment** - Create a preview deployment
5. **Configure webhooks** - Update Stripe/payment webhooks
6. **Database backups** - Set up MongoDB Atlas backups
7. **Error tracking** - Consider Sentry or similar

---

## 🎯 Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] All environment variables added to Vercel
- [ ] MongoDB Atlas allows Vercel connections
- [ ] Vercel Blob token is valid
- [ ] Build succeeds locally (`bun run build`)
- [ ] Deploy to Vercel
- [ ] Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_ROOT_DOMAIN` with actual URL
- [ ] Test login
- [ ] Test product upload
- [ ] Test payment flow
- [ ] Access admin panel

---

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- PayloadCMS Docs: https://payloadcms.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/

Good luck with your deployment! 🚀
