#!/bin/bash

# Setup script for Digital Ocean cron job
# Run this on your Digital Ocean server

echo "Setting up daily notification digest cron job..."

# Replace these with your actual values
APP_URL="https://your-domain.com"  # Replace with your actual domain
CRON_SECRET="1yY9fRWdPUQuA/TYx/s+4IroBolDYiGDC7JuypqgZlI="

# Create cron job that runs daily at 9 AM UTC
CRON_COMMAND="0 9 * * * curl -X POST ${APP_URL}/api/notifications/daily-digest -H 'Authorization: Bearer ${CRON_SECRET}' >> /var/log/daily-digest.log 2>&1"

# Add to crontab
(crontab -l 2>/dev/null | grep -v "daily-digest"; echo "$CRON_COMMAND") | crontab -

echo "✅ Cron job installed!"
echo "Schedule: Daily at 9:00 AM UTC"
echo "Logs will be saved to: /var/log/daily-digest.log"
echo ""
echo "To verify installation:"
echo "  crontab -l"
echo ""
echo "To test manually:"
echo "  curl -X POST ${APP_URL}/api/notifications/daily-digest -H 'Authorization: Bearer ${CRON_SECRET}'"
