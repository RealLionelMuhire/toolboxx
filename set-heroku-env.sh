#!/bin/bash
# Set environment variables for toolbay-app on Heroku

heroku config:set \
  BLOB_READ_WRITE_TOKEN="<YOUR_VERCEL_BLOB_TOKEN>" \
  DATABASE_URI="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB>?retryWrites=true&w=majority" \
  NEXT_PUBLIC_APP_URL="https://toolbay.net" \
  NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING="false" \
  NEXT_PUBLIC_ROOT_DOMAIN="toolbay.net" \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51RSlvhQNXfgJjmVmbxbORXTE4HHf9lBjtnokeXxem6ZaWlTO8Ifhti9MMc2N4wdCEOIGbjNZudVwVp6WdWDOljXE00WIlFINpT" \
  NEXT_PUBLIC_VAPID_PUBLIC_KEY="BLeVKTDnMj65UCfFcfoBmEouXdKTDRcyLeF_7Sc64fkRxF8knQsYcLzco9PM4aYIIrMbBeU8i783P1R4SDlh6gE" \
  PAYLOAD_SECRET="<YOUR_PAYLOAD_SECRET>" \
  RESEND_API_KEY="<YOUR_RESEND_API_KEY>" \
  SMTP_FROM_EMAIL="noreply@toolbay.store" \
  SMTP_FROM_NAME="Toolbay" \
  SMTP_HOST="smtp.gmail.com" \
  SMTP_PASS="<YOUR_SMTP_PASSWORD>" \
  SMTP_PORT="587" \
  SMTP_USER="mlcorporateservicesit@gmail.com" \
  STRIPE_SECRET_KEY="<YOUR_STRIPE_SECRET_KEY>" \
  STRIPE_WEBHOOK_SECRET="<YOUR_STRIPE_WEBHOOK_SECRET>" \
  VAPID_EMAIL="mailto:lionelmuhire1997@gmail.com" \
  VAPID_PRIVATE_KEY="<YOUR_VAPID_PRIVATE_KEY>" \
  --app toolbay-app

echo "✅ Environment variables set successfully!"
echo "View them with: heroku config --app toolbay-app"
