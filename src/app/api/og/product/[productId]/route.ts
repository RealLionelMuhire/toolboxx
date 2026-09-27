/**
 * Product link-preview image (og:image).
 * Renders the product photo into a 1200x630 JPEG, the size WhatsApp, Facebook and X
 * expect. Original uploads can be several MB or odd aspect ratios, which WhatsApp
 * in particular silently drops.
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

import { getPayloadSingleton } from '@/lib/payload-singleton';
import { getProductShareData } from '@/lib/product-share';

export const dynamic = 'force-dynamic';

const WIDTH = 1200;
const HEIGHT = 630;
const FETCH_TIMEOUT_MS = 8000;

const fallback = (req: NextRequest) =>
  NextResponse.redirect(new URL('/logo_toolbay.png', req.url), 302);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  try {
    const payload = await getPayloadSingleton();
    const product = await getProductShareData(payload, productId);
    if (!product?.imageUrl) return fallback(req);

    // Media URLs can be relative to the app (e.g. /api/media/file/...)
    const imageUrl = new URL(product.imageUrl, process.env.NEXT_PUBLIC_APP_URL || req.url);
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return fallback(req);

    // Show the whole product on a white canvas instead of cropping it
    const image = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .resize(WIDTH, HEIGHT, { fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(image), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[OG Image] Failed to render product image:', productId, error);
    return fallback(req);
  }
}
