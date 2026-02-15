import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const cookieStore = await cookies();
    
    // Get current user from session
    const { user } = await payload.auth({ headers: request.headers });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email } = body;

    // Validate input
    if (!username && !email) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) {
      updateData.email = email;
      // If email is changed, mark as unverified
      updateData.emailVerified = false;
    }

    // Update user
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: updateData,
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
