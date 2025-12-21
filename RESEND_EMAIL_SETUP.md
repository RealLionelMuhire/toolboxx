# 🚀 Production Email Setup with Resend

## Why Not SMTP in Production?

SMTP (like Gmail) often fails in production because:
- ❌ Port 587/465 blocked by hosting providers
- ❌ Rate limits (100 emails/day for Gmail free)
- ❌ Security restrictions
- ❌ Poor deliverability
- ❌ Emails marked as spam

**Solution:** Use a dedicated email service designed for production!

---

## ✅ Resend Setup (Recommended - 5 Minutes)

### Why Resend?
- ✅ **Free tier**: 100 emails/day, 3,000/month
- ✅ **Modern API**: Simple, fast, reliable
- ✅ **Great deliverability**: Emails won't go to spam
- ✅ **Developer-friendly**: Best developer experience
- ✅ **Built for production**: Used by top companies

### Step 1: Sign Up

1. Go to: https://resend.com
2. Sign up with your email
3. Verify your account

### Step 2: Get API Key

1. In Resend dashboard → **API Keys**
2. Click **Create API Key**
3. Name it: "Toolboxx Production"
4. **Copy the API key** (starts with `re_`)
   - Example: `re_123abc456def789ghi`

### Step 3: Verify Domain (Optional but Recommended)

**Option A: Use Test Email (Quick Start)**
- Use: `onboarding@resend.dev` as from address
- No domain verification needed
- Limited to 1 email per hour (testing only)

**Option B: Verify Your Domain (Production)**
1. In Resend dashboard → **Domains**
2. Click **Add Domain**
3. Enter your domain: `toolbay.store`
4. Add DNS records (shown in dashboard):
   ```
   Type: TXT
   Name: @
   Value: [shown in Resend]
   
   Type: TXT  
   Name: resend._domainkey
   Value: [shown in Resend]
   ```
5. Wait 5-10 minutes for DNS propagation
6. Click **Verify** in Resend dashboard

### Step 4: Update Railway Environment

Add to Railway variables:

```bash
# Remove or keep SMTP variables (for local dev)
# Add Resend API key
RESEND_API_KEY=re_123abc456def789ghi
```

### Step 5: Update .env (Local Dev)

Add to your `.env` file:

```bash
# Keep SMTP for local development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mlcorporateservicesit@gmail.com
SMTP_PASS=fksg puuj hqtq rsdr
SMTP_FROM_EMAIL=noreply@toolbay.store
SMTP_FROM_NAME=Toolbay

# Add Resend for production (optional - can test locally too)
# RESEND_API_KEY=re_123abc456def789ghi
```

### Step 6: Deploy

```bash
git add .
git commit -m "Switch to Resend for production emails"
git push
```

### Step 7: Test

After deployment:

1. Go to: `https://toolboxx-production.up.railway.app/test-email`
2. Click "Send Test Email"
3. Should send via Resend (check Railway logs for "[Resend] Email sent successfully")
4. Check inbox for test email

---

## 🔄 How It Works Now

### Local Development
```
RESEND_API_KEY not set → Uses SMTP (Gmail) ✅
```

### Production
```
RESEND_API_KEY set → Uses Resend ✅
```

The config automatically chooses:
- **Has RESEND_API_KEY?** → Use Resend
- **No RESEND_API_KEY?** → Use SMTP (for local dev)

---

## 🧪 Testing

### Test Locally with Resend

Add `RESEND_API_KEY` to your `.env`:
```bash
RESEND_API_KEY=re_123abc456def789ghi
```

Run test:
```bash
bun run test-email-send.mjs
```

Should see:
```
[Resend] Email sent successfully: abc123xyz
```

### Test in Production

```bash
railway logs --tail 50
```

Look for:
```
[Resend] Email sent successfully: abc123xyz
```

Or:
```
[Resend] Email send failed: [error details]
```

---

## 📊 Comparison: SMTP vs Resend

| Feature | SMTP (Gmail) | Resend |
|---------|-------------|---------|
| **Setup** | Complex (app passwords, 2FA) | Simple (API key) |
| **Free Tier** | 100/day | 3,000/month |
| **Deliverability** | ⚠️ Often spam | ✅ Excellent |
| **Speed** | 2-5 seconds | <1 second |
| **Production Ready** | ❌ No | ✅ Yes |
| **Port Blocking** | ❌ Common issue | ✅ N/A (API) |
| **Reliability** | ⚠️ Medium | ✅ High |

---

## 🎯 Alternative: SendGrid

If you prefer SendGrid:

### Setup SendGrid

1. Sign up: https://sendgrid.com
2. Get API key
3. Add to Railway:
   ```bash
   SENDGRID_API_KEY=SG.xxxxx
   ```

### Update Config

In `payload.config.ts`:

```typescript
import { sendGridAdapter } from '@payloadcms/email-sendgrid'

email: process.env.SENDGRID_API_KEY
  ? sendGridAdapter({
      apiKey: process.env.SENDGRID_API_KEY,
      defaultFromAddress: 'noreply@toolbay.store',
      defaultFromName: 'Toolbay',
    })
  : nodemailerAdapter({ /* SMTP config */ })
```

Install package:
```bash
bun add @payloadcms/email-sendgrid
```

---

## 🐛 Troubleshooting

### Issue: "Invalid API key"

**Cause:** Wrong API key or not set

**Fix:**
1. Check Railway variables: `RESEND_API_KEY=re_xxxxx`
2. Regenerate key in Resend dashboard if needed

### Issue: "Domain not verified"

**Cause:** Trying to send from unverified domain

**Fix Option 1 (Quick):**
- Use `onboarding@resend.dev` as from address
- Update Railway: `SMTP_FROM_EMAIL=onboarding@resend.dev`

**Fix Option 2 (Production):**
- Verify your domain in Resend dashboard
- Add DNS records
- Wait for verification

### Issue: Still using SMTP in production

**Cause:** RESEND_API_KEY not set in Railway

**Fix:**
1. Go to Railway → Variables
2. Add: `RESEND_API_KEY=re_xxxxx`
3. Redeploy

### Issue: "Rate limit exceeded"

**Cause:** Exceeded free tier (3,000/month)

**Fix:**
- Upgrade Resend plan ($20/month for 50k emails)
- Or switch to SendGrid

---

## ✅ Verification Checklist

After setup:

- [ ] Signed up for Resend account
- [ ] Got API key from dashboard
- [ ] Added `RESEND_API_KEY` to Railway
- [ ] (Optional) Verified domain in Resend
- [ ] Deployed code changes
- [ ] Tested sending email
- [ ] Received test email successfully
- [ ] Checked Railway logs show "[Resend]" messages
- [ ] Tested registration email
- [ ] Tested forgot password email
- [ ] All emails arriving in inbox (not spam)

---

## 📧 Email Types That Will Work

After setup, all these will work in production:

1. ✅ **Registration verification emails**
2. ✅ **Password reset emails**
3. ✅ **Resend verification emails**
4. ✅ **Order confirmation emails** (if you add them)
5. ✅ **Transaction notifications** (if you add them)

---

## 🎉 Summary

**Before (SMTP):**
- ❌ Doesn't work in production
- ❌ Port blocked
- ❌ Rate limits
- ❌ Goes to spam

**After (Resend):**
- ✅ Works in production
- ✅ No port issues (API-based)
- ✅ 3,000 emails/month free
- ✅ Great deliverability
- ✅ Fast and reliable

**Next Steps:**
1. Sign up at resend.com (2 minutes)
2. Get API key
3. Add to Railway
4. Deploy
5. Test
6. Done! 🎉

**Total time:** 5-10 minutes
**Cost:** FREE (up to 3,000 emails/month)
