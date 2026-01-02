# Daily Notification Digest Setup

This document explains how to set up automated daily notifications for users who have enabled notifications.

## What It Does

The daily digest system automatically sends notifications to users once per day:

### For Tenants (Store Owners):
- **Daily**: Reminder about unverified transactions (if any)
- **Monday Only**: Weekly sales summary (orders, revenue, top product)

### For Customers:
- **Daily**: Active orders status reminder
- **Daily**: Unread messages notification

### For All Users:
- Only sends to users who have **enabled push notifications**
- Only sends if there's something relevant (no spam!)

## API Endpoint

```
POST /api/notifications/daily-digest
```

**Authentication**: Requires `Authorization: Bearer YOUR_CRON_SECRET` header

## Setup Instructions

### Option 1: Vercel Cron (Recommended for Vercel Deployment)

1. **Create `vercel.json` cron configuration**:
```json
{
  "crons": [
    {
      "path": "/api/notifications/daily-digest",
      "schedule": "0 9 * * *"
    }
  ]
}
```

2. **Set environment variable**:
```bash
CRON_SECRET=your-secret-key-here
```

3. **Deploy** - Vercel will automatically run the cron job daily at 9 AM UTC

### Option 2: Railway Cron

1. **Add to `railway.json`**:
```json
{
  "cron": [
    {
      "schedule": "0 9 * * *",
      "command": "curl -X POST https://your-domain.com/api/notifications/daily-digest -H 'Authorization: Bearer ${CRON_SECRET}'"
    }
  ]
}
```

2. **Set environment variable** in Railway dashboard:
```
CRON_SECRET=your-secret-key-here
```

### Option 3: External Cron Service (cron-job.org, EasyCron)

1. **Go to** [cron-job.org](https://cron-job.org) or similar service
2. **Create a new cron job**:
   - URL: `https://your-domain.com/api/notifications/daily-digest`
   - Schedule: `0 9 * * *` (daily at 9 AM)
   - Method: `POST`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

3. **Set environment variable** on your hosting platform:
```
CRON_SECRET=your-secret-key-here
```

### Option 4: GitHub Actions (Free)

1. **Create `.github/workflows/daily-digest.yml`**:
```yaml
name: Daily Notification Digest

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Digest
        run: |
          curl -X POST \
            https://your-domain.com/api/notifications/daily-digest \
            -H 'Authorization: Bearer ${{ secrets.CRON_SECRET }}'
```

2. **Add secret** in GitHub repository:
   - Go to Settings → Secrets → New repository secret
   - Name: `CRON_SECRET`
   - Value: `your-secret-key-here`

## Testing

### Manual Test
```bash
curl -X POST https://your-domain.com/api/notifications/daily-digest \
  -H 'Authorization: Bearer YOUR_CRON_SECRET'
```

### Expected Response
```json
{
  "success": true,
  "message": "Daily digest sent",
  "stats": {
    "usersProcessed": 45,
    "notificationsSent": 12,
    "dayOfWeek": 1,
    "timestamp": "2026-01-02T09:00:00.000Z"
  }
}
```

## Security

- The endpoint is protected by API key (`CRON_SECRET` or `PAYLOAD_SECRET`)
- Only users with active push subscriptions receive notifications
- Each notification type is sent only when relevant

## Customization

### Change Schedule
Edit the cron expression (currently `0 9 * * *`):
- `0 9 * * *` = Daily at 9 AM UTC
- `0 12 * * *` = Daily at 12 PM UTC
- `0 9 * * 1` = Every Monday at 9 AM UTC

### Change Notification Content
Edit `/src/app/api/notifications/daily-digest/route.ts`:
- Modify notification titles and messages
- Add new notification types
- Change notification priorities

## Monitoring

Check logs for:
- `[Daily Digest] Starting daily notification digest...`
- `[Daily Digest] Found X users with notifications enabled`
- `[Daily Digest] Complete. Sent X notifications.`

## Environment Variables

Required:
- `CRON_SECRET` - Secret key for cron authentication (or uses `PAYLOAD_SECRET` as fallback)

Optional:
- `NEXT_PUBLIC_APP_URL` - Your app URL (auto-detected in production)

## Troubleshooting

**No notifications sent?**
- Check users have push notifications enabled
- Verify there's relevant data (unverified transactions, pending orders, etc.)
- Check API logs for errors

**Authentication failed?**
- Verify `CRON_SECRET` is set correctly
- Check Authorization header format: `Bearer YOUR_SECRET`

**Timeout errors?**
- Large user base? Consider batching or increasing `maxDuration`
- Current limit: 60 seconds
