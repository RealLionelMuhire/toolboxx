/**
 * Debug: Get first media R2 URL to verify in browser
 * GET /api/debug-r2-url
 * Remove this file after debugging.
 */
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'media',
      limit: 1,
      where: { url: { contains: 'r2.dev' } },
    });
    const doc = result.docs[0];
    if (!doc?.url) {
      return NextResponse.json({
        ok: false,
        message: 'No R2 media found. Run storage:migrate?',
      });
    }
    return NextResponse.json({
      ok: true,
      url: doc.url,
      filename: doc.filename,
      hint: 'Open the URL in a new tab. If it loads, R2 is fine. If 403/404, check bucket public access.',
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
