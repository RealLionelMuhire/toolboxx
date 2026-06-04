import { NextResponse } from 'next/server';
import { getPayloadSingleton } from '@/lib/payload-singleton';

/**
 * Health check endpoint for DigitalOcean / Railway / Docker healthchecks.
 * Performs a lightweight DB ping so the load balancer knows when the
 * database is unreachable — not just whether Node.js is running.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getPayloadSingleton();

    // Lightweight DB ping: fetch 1 user doc — cheap but confirms MongoDB is reachable
    await payload.find({ collection: 'users', limit: 1, depth: 0 });

    return NextResponse.json(
      {
        status: 'ok',
        db: 'connected',
        timestamp: new Date().toISOString(),
        service: 'toolbay',
      },
      {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      }
    );
  } catch (err) {
    console.error('[Health] DB ping failed:', err);
    // Return 503 so DO/Railway marks the container as unhealthy and restarts it
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      }
    );
  }
}
