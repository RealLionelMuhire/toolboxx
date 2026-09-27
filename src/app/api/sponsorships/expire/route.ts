/**
 * Sponsorship Expiry API Route
 * Marks active sponsorships past their end date as "expired", which resets the
 * product's sponsorshipStatus so it stops being promoted and the seller can re-request.
 *
 * Call this periodically (e.g. hourly) via system cron on the Droplet or Vercel Cron.
 * Listings already hide ended sponsorships, so a missed run only delays the status update.
 *
 * Security: Protected by API key in Authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayloadSingleton } from '@/lib/payload-singleton';
import { expireEndedSponsorships } from '@/lib/sponsorships';

export const dynamic = 'force-dynamic';

async function handle(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const apiKey = process.env.CRON_SECRET || process.env.PAYLOAD_SECRET;

  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await getPayloadSingleton();
    const { expiredIds, failedIds } = await expireEndedSponsorships(payload);

    console.log(`[Sponsorship Expiry] Expired ${expiredIds.length}, failed ${failedIds.length}`);

    return NextResponse.json({
      success: failedIds.length === 0,
      expired: expiredIds.length,
      expiredIds,
      failedIds,
    });
  } catch (error) {
    console.error('[Sponsorship Expiry] Error:', error);
    return NextResponse.json({ error: 'Failed to expire sponsorships' }, { status: 500 });
  }
}

// POST for system cron / manual runs, GET for Vercel Cron
export const POST = handle;
export const GET = handle;
