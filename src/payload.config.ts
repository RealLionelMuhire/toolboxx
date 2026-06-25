// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
// import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@/lib/email/resend-adapter'
// import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// import { isSuperAdmin } from './lib/access';

import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders';
import { Sales } from './collections/Sales';
import { Tenants } from './collections/Tenants'
import { Reviews } from './collections/Reviews';
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Transactions } from './collections/Transactions'
import { Messages } from './collections/Messages'
import { Conversations } from './collections/Conversations'
import { PushSubscriptions } from './collections/PushSubscriptions'
import { Notifications } from './collections/Notifications'
import { Tenders } from './collections/Tenders'
import { TenderBids } from './collections/TenderBids'
import { Sponsorships } from './collections/Sponsorships'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    autoLogin: false,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['@/components/admin/UserVerificationBadge'],
      actions: ['@/components/admin/BackToStoreButton'],
    },
  },
  // Use Resend for email delivery (free: 3,000 emails/month, 100/day)
  // Docs: https://resend.com — verify domain to send from noreply@toolbay.net
  // On localhost without a verified domain, use fromAddress: 'onboarding@resend.dev'
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev',
    defaultFromName: process.env.SMTP_FROM_NAME || 'Toolbay',
  }),
  collections: [Users, Media, Categories, Products, Tags, Tenants, Transactions, Orders, Reviews, Sales, Conversations, Messages, PushSubscriptions, Notifications, Tenders, TenderBids, Sponsorships],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
    transactionOptions: false, // Disable transactions for compatibility
    connectOptions: {
      maxPoolSize: 10,              // Maximum number of connections in the pool
      minPoolSize: 2,               // Keep at least 2 connections warm at all times
      socketTimeoutMS: 30000,       // Close sockets after 30 seconds of inactivity
      serverSelectionTimeoutMS: 30000, // Increased to 30s for DO/MongoDB Atlas
      connectTimeoutMS: 30000,      // Connection establishment timeout
      maxIdleTimeMS: 60000,         // 60s — above DO network idle firewall threshold
      heartbeatFrequencyMS: 10000,  // Ping Atlas every 10s to keep connections warm
      retryWrites: true,            // Retry writes on network errors
      retryReads: true,             // Retry reads on network errors
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin({ storage: false }),
    // Temporarily disable multi-tenant plugin to test
    // multiTenantPlugin({
    //   collections: {
    //     products: {},
    //     media: {},
    //     // Do NOT include tenants collection here - this should prevent filtering
    //   },
    //   tenantsArrayField: {
    //     includeDefaultField: false,
    //   },
    //   userHasAccessToAllTenants: (user) => isSuperAdmin(user),
    // }),
    s3Storage({
      acl: 'public-read',
      collections: {
        media: {
          prefix: 'media',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => {
            const r2Url = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
            if (!r2Url) {
              console.warn('[Payload] R2_PUBLIC_URL is not set. Media URLs will be relative and may break Next.js Image component.');
            }
            const base = (r2Url || '').replace(/\/$/, '')
            const path = prefix ? `${prefix}/${filename}` : filename
            return base ? `${base}/${path}` : `/media/${filename}`
          },
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: true,
      },
    }),
  ],
})
