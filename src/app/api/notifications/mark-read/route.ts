/**
 * API Route: Mark Notification as Read
 * Marks a single notification as read (clicked/opened)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: {
        read: true,
        seen: true, // Also mark as seen when read
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
