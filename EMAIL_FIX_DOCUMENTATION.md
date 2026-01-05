# Email Delivery Fix - January 5, 2026

## Problem
Registration and password reset emails were not being delivered to users.

## Root Cause
The application was configured to use **Resend** email service (`resendAdapter`) in `src/payload.config.ts`, but the Resend API key was either invalid or had restrictions. The configuration wasn't using the valid SMTP/Gmail credentials that were available in the environment variables.

## Solution
Switched from Resend adapter to Nodemailer adapter to use Gmail SMTP directly.

### Changes Made

#### 1. Updated `src/payload.config.ts`
**Before:**
```typescript
email: resendAdapter({
  apiKey: process.env.RESEND_API_KEY || 're_B9Locd8M_ASuAoooS9D1RE8PTT89SYGqr',
  defaultFromAddress: 'onboarding@resend.dev',
  defaultFromName: 'Toolbay',
}),
```

**After:**
```typescript
email: nodemailerAdapter({
  defaultFromAddress: process.env.SMTP_FROM_EMAIL || 'noreply@toolbay.store',
  defaultFromName: process.env.SMTP_FROM_NAME || 'Toolbay',
  transportOptions: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // Use TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
}),
```

#### 2. Created Test Script
Created `scripts/test-smtp-email.mjs` to test and verify SMTP configuration.

## Environment Variables Required

Make sure these are set in your **production environment** (Railway/Vercel):

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mlcorporateservicesit@gmail.com
SMTP_PASS=fksg puuj hqtq rsdr  # Gmail App Password (remove spaces if needed)
SMTP_FROM_EMAIL=noreply@toolbay.store
SMTP_FROM_NAME=Toolbay
```

### Important Notes About Gmail App Password

1. **Must be an App Password**, not your regular Gmail password
2. **Remove all spaces** - Some implementations include spaces but they should be removed
3. The format is: `xxxx xxxx xxxx xxxx` (with spaces) → Remove spaces → `xxxxxxxxxxxxxxxx`

Your current password in production appears to have spaces: `fksg puuj hqtq rsdr`

**For Production, use:** `fksgpuujhqtqrsdr` (no spaces)

## Testing

### Local Testing
```bash
cd ~/HomeLTD/toolboxx
node scripts/test-smtp-email.mjs
```

### Production Testing
After deployment, test at: `https://toolbay.net/test-email`

## Verification Checklist

- [x] SMTP credentials configured in .env
- [x] Gmail App Password generated (with 2-Step Verification enabled)
- [x] Updated payload.config.ts to use nodemailerAdapter
- [x] Local test successful
- [ ] Deploy to production
- [ ] Update production environment variables (remove spaces from SMTP_PASS)
- [ ] Test registration email on production
- [ ] Test password reset email on production

## Deployment Steps

1. **Build the application:**
   ```bash
   bun run build
   ```

2. **Update production environment variables:**
   - Go to Railway dashboard → Project → Variables
   - Update `SMTP_PASS` to: `fksgpuujhqtqrsdr` (no spaces)
   - Verify all other SMTP variables are set correctly

3. **Deploy to production:**
   ```bash
   git add .
   git commit -m "fix: switch from Resend to SMTP for email delivery"
   git push origin main
   ```

4. **Test on production:**
   - Register a new test user
   - Check email inbox for verification email
   - Test password reset flow

## Email Flow

### Registration:
1. User registers → `POST /api/auth/register`
2. System creates user with `emailVerified: false`
3. Generates verification token (24hr expiry)
4. Sends verification email via SMTP
5. User clicks link → `GET /verify-email?token=xxx`
6. Token validated → User marked as verified
7. User can now log in

### Password Reset:
1. User requests reset → `POST /api/auth/forgot-password`
2. System generates reset token (24hr expiry)
3. Sends reset email via SMTP
4. User clicks link → `GET /reset-password?token=xxx`
5. User enters new password
6. Token validated → Password updated
7. User can log in with new password

## Troubleshooting

### If emails still don't send:

1. **Check SMTP connection:**
   ```bash
   node scripts/test-smtp-email.mjs
   ```

2. **Check server logs for errors:**
   ```bash
   railway logs --tail 100 | grep -i 'email\|smtp'
   ```

3. **Common issues:**
   - App Password has spaces (remove them)
   - Using regular Gmail password instead of App Password
   - 2-Step Verification not enabled
   - Gmail blocking "less secure apps"
   - SMTP port blocked (try 465 with `secure: true`)

4. **Alternative solution:**
   If Gmail continues to have issues, consider using:
   - **SendGrid** (100 emails/day free)
   - **Mailgun** (100 emails/day free)
   - **AWS SES** (62,000 emails/month free)

## Success Confirmation

✅ **Local test successful** - Email sent at 2026-01-05
- SMTP connection verified
- Test email delivered to mlcorporateservicesit@gmail.com
- Message ID: `<6955eca9-8d00-aa3c-9422-4d367b524b17@toolbay.store>`

Once deployed to production, users will be able to:
- ✅ Receive email verification emails after registration
- ✅ Receive password reset emails when requested
- ✅ Complete the email verification flow
- ✅ Reset their passwords successfully
