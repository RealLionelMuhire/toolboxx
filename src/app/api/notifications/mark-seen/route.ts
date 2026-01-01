/**
 * API Route: Mark Notifications as Seen
 * Marks one or more notifications as seen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds must be an array' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    // Update notifications in batch
    const updatePromises = notificationIds.map((id: string) =>
      payload.update({
        collection: 'notifications',
        id,
        data: {
          seen: true,
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      updated: notificationIds.length,
    });
  } catch (error) {
    console.error('Error marking notifications as seen:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as seen' },
      { status: 500 }
    );
  }
}
