#!/bin/bash
# Set environment variables for toolbay-app on Heroku

heroku config:set \
  BLOB_READ_WRITE_TOKEN="vercel_blob_rw_stL2WgafPHil5ATC_F74doONeFL88DfPYegMeJmmjEe3g2z" \
  DATABASE_URI="mongodb+srv://toolbay01_db_user:DbDKPVyf0Kikfhi2@toolbayproductioncluste.aq3gvoz.mongodb.net/toolboxx?retryWrites=true&w=majority&appName=ToolbayProductionCluster" \
  NEXT_PUBLIC_APP_URL="https://toolbay.net" \
  NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING="false" \
  NEXT_PUBLIC_ROOT_DOMAIN="toolbay.net" \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51RSlvhQNXfgJjmVmbxbORXTE4HHf9lBjtnokeXxem6ZaWlTO8Ifhti9MMc2N4wdCEOIGbjNZudVwVp6WdWDOljXE00WIlFINpT" \
  NEXT_PUBLIC_VAPID_PUBLIC_KEY="BLeVKTDnMj65UCfFcfoBmEouXdKTDRcyLeF_7Sc64fkRxF8knQsYcLzco9PM4aYIIrMbBeU8i783P1R4SDlh6gE" \
  PAYLOAD_SECRET="456dc321fa8e3861ecc2d373eed69a6100acd09717af063e3627e3247f0019a1" \
  RESEND_API_KEY="re_B9Locd8M_ASuAoooS9D1RE8PTT89SYGqr" \
  SMTP_FROM_EMAIL="noreply@toolbay.store" \
  SMTP_FROM_NAME="Toolbay" \
  SMTP_HOST="smtp.gmail.com" \
  SMTP_PASS="fksg puuj hqtq rsdr" \
  SMTP_PORT="587" \
  SMTP_USER="mlcorporateservicesit@gmail.com" \
  STRIPE_SECRET_KEY="sk_test_51RSlvhQNXfgJjmVmcxDVOhMuaDDWalu5oRhb00tNkU4lVwd0ZXG8FhQf51qWrS0gxaSDSSaXcSrk1xsIofQWdr0d00cQUbS90h" \
  STRIPE_WEBHOOK_SECRET="whsec_da810d29c67c2955ae27246f4d3f2566eb2eedbe4570e478c6ebda9285a447d5" \
  VAPID_EMAIL="mailto:lionelmuhire1997@gmail.com" \
  VAPID_PRIVATE_KEY="NflOoTj5qVB3FLhoVdWMkOE5scSTC9CEsuYwUitu73Y" \
  --app toolbay-app

echo "✅ Environment variables set successfully!"
echo "View them with: heroku config --app toolbay-app"
