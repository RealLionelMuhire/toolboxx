/**
 * Store link-preview image (og:image).
 * Store logos are usually small squares, so instead of stretching one to the
 * 1200x630 preview size this renders a card with the logo, name and details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

import { getPayloadSingleton } from '@/lib/payload-singleton';
import { getStoreShareData } from '@/lib/store-share';

export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT_MS = 8000;
const LOGO_SIZE = 280;

// Satori (behind ImageResponse) can't decode every format (e.g. WebP), so the logo
// is normalised to a PNG data URL first
async function loadLogo(logoUrl: string, baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(new URL(logoUrl, baseUrl), { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return null;
    const png = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'cover' })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const payload = await getPayloadSingleton();
    const store = await getStoreShareData(payload, slug);
    if (!store) {
      return NextResponse.redirect(new URL('/logo_toolbay.png', req.url), 302);
    }

    const logo = store.logoUrl
      ? await loadLogo(store.logoUrl, process.env.NEXT_PUBLIC_APP_URL || req.url)
      : null;
    const details = [store.categoryLabel, store.locationLabel].filter(Boolean).join(' · ');

    const image = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#F4F4F0',
            padding: '64px 72px',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                width={LOGO_SIZE}
                height={LOGO_SIZE}
                style={{ borderRadius: LOGO_SIZE / 2, border: '6px solid #000000' }}
                alt=""
              />
            ) : (
              <div
                style={{
                  width: LOGO_SIZE,
                  height: LOGO_SIZE,
                  borderRadius: LOGO_SIZE / 2,
                  border: '6px solid #000000',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  fontSize: 140,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {store.name.trim().charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>
              <div
                style={{
                  fontSize: store.name.length > 28 ? 60 : 76,
                  fontWeight: 700,
                  color: '#000000',
                  lineHeight: 1.1,
                  display: 'flex',
                }}
              >
                {store.name}
              </div>
              {store.isVerified && (
                <div style={{ display: 'flex' }}>
                  <div
                    style={{
                      display: 'flex',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: 30,
                      fontWeight: 700,
                      padding: '8px 22px',
                      borderRadius: 999,
                    }}
                  >
                    Verified store
                  </div>
                </div>
              )}
              {details && (
                <div style={{ fontSize: 34, color: '#404040', display: 'flex' }}>{details}</div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '4px solid #000000',
              paddingTop: 28,
              fontSize: 34,
            }}
          >
            <div style={{ display: 'flex', color: '#000000', fontWeight: 700 }}>
              {`${store.productCount} product${store.productCount === 1 ? '' : 's'}`}
            </div>
            <div style={{ display: 'flex', color: '#ea580c', fontWeight: 700 }}>ToolBay</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );

    return new NextResponse(image.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[OG Image] Failed to render store image:', slug, error);
    return NextResponse.redirect(new URL('/logo_toolbay.png', req.url), 302);
  }
}
