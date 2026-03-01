import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper output for Railway deployment
  output: 'standalone',
  
  // Ensure external packages are included in standalone
  serverExternalPackages: ['ws', 'web-push', 'mongodb'],
  
  // Ensure client components are properly bundled
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  images: {
    // Next.js optimizes images: resizes, WebP/AVIF, caches. Much faster than loading full-res from R2.
    // R2 is public — no 401. transformAlgorithm stderr is patched in start script.
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24h — product images rarely change
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self' https://*.r2.dev https://*.public.blob.vercel-storage.com; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      // Cloudflare R2 (pub-xxx.r2.dev or custom domain)
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // R2 custom domain (e.g. cdn.yourdomain.com from R2_PUBLIC_URL)
      ...(process.env.R2_PUBLIC_URL
        ? (() => {
            try {
              const url = new URL(process.env.R2_PUBLIC_URL);
              if (!url.hostname.endsWith('.r2.dev')) {
                return [{ protocol: url.protocol.replace(':', ''), hostname: url.hostname }];
              }
            } catch {}
            return [];
          })()
        : []),
      // Railway deployment support - wildcard for all railway domains
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'http',
        hostname: '**.railway.app',
      },
      // Allow images from the current deployment domain
      ...(process.env.NEXT_PUBLIC_APP_URL
        ? [
            {
              protocol: new URL(process.env.NEXT_PUBLIC_APP_URL).protocol.replace(':', ''),
              hostname: new URL(process.env.NEXT_PUBLIC_APP_URL).hostname,
            },
          ]
        : []),
      // Allow images from Vercel preview deployments
      ...(process.env.VERCEL_URL
        ? [
            {
              protocol: 'https',
              hostname: process.env.VERCEL_URL,
            },
          ]
        : []),
      // Railway deployment support
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'https',
        hostname: '**.shutterstock.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
