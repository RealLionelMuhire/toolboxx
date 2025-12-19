# Email Verification and Password Reset Setup

This document explains the email verification and password reset system implemented in your Toolbay application.

## Features Implemented

✅ **Email Verification**: Users must verify their email after registration  
✅ **Password Reset**: Users can reset forgotten passwords via email  
✅ **Persistent Sessions**: "Keep me signed in" checkbox for 30-day sessions  
✅ **Beautiful Email Templates**: Professional HTML emails with branding

## Required Environment Variables

Add these to your `.env` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@toolbay.store
SMTP_FROM_NAME=Toolbay
```

## Gmail Setup Instructions

### Option 1: Gmail App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Toolbay App"
   - Copy the 16-character password
   - Use this as `SMTP_PASS` in your `.env`

3. **Configure .env**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop  # 16-char app password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

### Option 2: Other SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.com
SMTP_PASS=YOUR_MAILGUN_PASSWORD
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=YOUR_AWS_SMTP_USERNAME
SMTP_PASS=YOUR_AWS_SMTP_PASSWORD
```

## How It Works

### 1. User Registration

When a user signs up:
1. Account is created with `emailVerified: false`
2. A secure 32-byte verification token is generated
3. Token expires in 24 hours
4. Verification email is sent automatically
5. User can log in but should verify email to access all features

### 2. Email Verification

1. User clicks link in email: `/verify-email?token=xxxxx`
2. System verifies the token is valid and not expired
3. User's `emailVerified` field is set to `true`
4. Success message is shown

### 3. Password Reset Flow

1. User clicks "Forgot Password?" on login page
2. Enters email address at `/forgot-password`
3. System generates reset token (24-hour expiry)
4. Reset email is sent with link: `/reset-password?token=xxxxx`
5. User enters new password
6. Password is updated and tokens are cleared
7. User redirected to login

## New Pages Created

- `/forgot-password` - Request password reset
- `/reset-password` - Set new password with token
- `/verify-email` - Verify email with token

## API Endpoints (tRPC Procedures)

```typescript
// Email Verification
auth.verifyEmail({ token: string })
auth.resendVerification({ email: string })

// Password Reset
auth.forgotPassword({ email: string })
auth.resetPassword({ token: string, password: string, confirmPassword: string })
```

## Security Features

✅ **Secure Tokens**: 32-byte cryptographically random tokens  
✅ **Token Expiration**: All tokens expire in 24 hours  
✅ **No Email Enumeration**: Same message whether email exists or not  
✅ **Password Hashing**: Payload CMS handles secure password hashing  
✅ **httpOnly Cookies**: Session tokens are httpOnly and secure  

## Testing Locally

### Using Gmail (Development)

1. Create a test Gmail account
2. Enable 2FA and generate app password
3. Add credentials to `.env`
4. Test registration flow

### Email Preview (No SMTP Required)

If you want to test without real emails:

1. Comment out the email sending in `src/modules/auth/server/procedures.ts`
2. Log the verification links to console instead:

```typescript
// For development testing
console.log('Verification URL:', verificationUrl);
// sendVerificationEmail(...).catch(...)
```

## Production Deployment

### Vercel/Railway/Render

Add environment variables in your hosting dashboard:

1. Go to your project settings
2. Add Environment Variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM_EMAIL`

3. Redeploy your application

### Important Notes

⚠️ **Gmail Daily Limits**: Gmail free accounts have a 500 emails/day limit  
⚠️ **Production Use**: For production, consider using SendGrid, Mailgun, or AWS SES  
⚠️ **Custom Domain**: Use a custom email domain for better deliverability  

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials** in `.env`
2. **Verify Gmail app password** is correct (no spaces)
3. **Check console logs** for error messages
4. **Test SMTP connection**:
   ```bash
   npm install -g nodemailer
   ```

### Emails Going to Spam

1. **Use a custom domain** instead of Gmail
2. **Set up SPF/DKIM records**
3. **Use a dedicated email service** (SendGrid, Mailgun)
4. **Verify sender domain**

### Token Expired Errors

- Tokens expire in 24 hours
- User must request a new token
- Use `/forgot-password` or resend verification

## Email Templates

The system sends two types of emails:

### 1. Verification Email
- **Subject**: "Verify your Toolbay account"
- **Content**: Welcome message with verification button
- **Action**: Click to verify email
- **Expiry**: 24 hours

### 2. Password Reset Email
- **Subject**: "Reset your Toolbay password"
- **Content**: Reset instructions with reset button
- **Action**: Click to reset password
- **Expiry**: 24 hours

## Database Fields Added

### Users Collection

```typescript
{
  emailVerified: boolean,           // Whether email is verified
  verificationToken: string | null, // Token for email verification
  verificationExpires: Date | null, // When verification token expires
  // resetPasswordToken and resetPasswordExpiration already exist in PayloadCMS
}
```

## Next Steps

1. ✅ Add SMTP credentials to `.env`
2. ✅ Test registration and email verification
3. ✅ Test password reset flow
4. ✅ Deploy and test in production
5. ⬜ (Optional) Add email verification check on protected routes
6. ⬜ (Optional) Send reminder emails for unverified accounts

## Support

For issues or questions about the email system:
- Check PayloadCMS documentation: https://payloadcms.com/docs/email/overview
- Check nodemailer documentation: https://nodemailer.com/about/
- Review the implementation in `src/modules/auth/`
