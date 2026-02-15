import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    
    // Get current user from session
    const { user } = await payload.auth({ headers: request.headers });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify current password by attempting login
    try {
      await payload.login({
        collection: 'users',
        data: {
          email: user.email,
          password: currentPassword,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: newPassword,
      },
    });

    return NextResponse.json({
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
