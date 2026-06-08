import { NextRequest, NextResponse } from 'next/server';
import { getPayloadSingleton } from '@/lib/payload-singleton';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 *
 * Server-side media upload proxy.
 *
 * WHY THIS EXISTS:
 * Payload's REST endpoint POST /api/media requires a CSRF token for
 * cookie-based auth (browser sessions). Fetching directly from the client
 * to Payload's REST API always returns 401 unless a CSRF token header is
 * also included — which is painful to manage in custom client components.
 *
 * This route receives the file from the browser, authenticates the user
 * server-side using the Payload cookie (no CSRF needed on the local API),
 * and calls Payload's local `create` method directly. This is the
 * recommended pattern for Next.js + Payload CMS apps.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadSingleton();

    // ── 1. Authenticate the user from the Payload session cookie ──────────
    const cookieStore = await cookies();
    const cookiePrefix = process.env.PAYLOAD_COOKIE_PREFIX || 'payload';
    const tokenCookie = cookieStore.get(`${cookiePrefix}-token`);

    if (!tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized: no session cookie' },
        { status: 401 }
      );
    }

    // Verify the token and get the user via Payload's auth API
    const { user } = await payload.auth({
      headers: new Headers({ cookie: `${cookiePrefix}-token=${tokenCookie.value}` }),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid or expired session' },
        { status: 401 }
      );
    }

    // ── 2. Check upload permission ─────────────────────────────────────────
    const isSuperAdmin = (user as any)?.roles?.includes('super-admin');
    const isTenant = (user as any)?.roles?.includes('tenant');
    const hasTenantRelationship = Array.isArray((user as any)?.tenants) && (user as any).tenants.length > 0;

    if (!isSuperAdmin && !isTenant && !hasTenantRelationship) {
      return NextResponse.json(
        { error: 'Forbidden: only tenants and admins can upload media' },
        { status: 403 }
      );
    }

    // ── 3. Parse the multipart form data ──────────────────────────────────
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const alt = (formData.get('alt') as string) || '';

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file provided in form data' },
        { status: 400 }
      );
    }

    // ── 4. Convert File → Buffer for Payload local API ────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 5. Create the media document via Payload local API ────────────────
    // This completely bypasses CSRF since it's a direct server-side call
    const doc = await payload.create({
      collection: 'media',
      data: { alt: alt || file.name.replace(/\.[^/.]+$/, '') },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: false, // Respect access control
      user,
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error: any) {
    console.error('[/api/upload] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
