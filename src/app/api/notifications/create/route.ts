/**
 * API Route: Create Notification
 * Creates a new notification in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      type,
      title,
      message,
      icon,
      url,
      priority = 'normal',
      data = {},
      expiresAt,
    } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    // Create notification
    const notification = await payload.create({
      collection: 'notifications',
      data: {
        user: userId,
        type,
        title,
        message,
        icon,
        url,
        priority,
        data,
        seen: false,
        read: false,
        sentViaPush: false,
        ...(expiresAt && { expiresAt }),
      },
    });

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
