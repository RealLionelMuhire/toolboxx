import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import { z } from 'zod';
import config from '@/payload.config';

import {
  generateToken,
  getTokenExpiration,
  sendVerificationEmail,
} from '@/modules/auth/email-utils';

// Every field is optional: the client only sends what changed.
// Empty strings clear the optional personal fields.
const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/,
      'Username can only contain letters, numbers, dots, underscores and hyphens, and must start and end with a letter or number'
    )
    .optional(),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').optional(),
  firstName: z.string().trim().max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().trim().max(50, 'Last name must be less than 50 characters').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9]{9,15})?$/, 'Phone number must contain 9-15 digits, optionally starting with +')
    .optional(),
});

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

    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || 'Invalid profile data' },
        { status: 400 }
      );
    }

    const { username, email, firstName, lastName, phone } = parsed.data;
    const emailChanged = email !== undefined && email !== user.email;
    const usernameChanged = username !== undefined && username !== user.username;

    // Prepare update data
    const updateData: any = {};
    if (usernameChanged) updateData.username = username;
    if (firstName !== undefined) updateData.firstName = firstName || null;
    if (lastName !== undefined) updateData.lastName = lastName || null;
    if (phone !== undefined) updateData.phone = phone || null;

    if (emailChanged) {
      updateData.email = email;
      // A changed email must be verified again
      updateData.emailVerified = false;
      updateData.verificationToken = generateToken();
      updateData.verificationExpires = getTokenExpiration().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }

    // Check uniqueness up front for a readable error instead of a database index error
    if (usernameChanged || emailChanged) {
      const conflicts = await payload.find({
        collection: 'users',
        limit: 2,
        depth: 0,
        where: {
          and: [
            { id: { not_equals: user.id } },
            {
              or: [
                ...(usernameChanged ? [{ username: { equals: username } }] : []),
                ...(emailChanged ? [{ email: { equals: email } }] : []),
              ],
            },
          ],
        },
      });

      if (conflicts.docs.some((doc) => usernameChanged && doc.username === username)) {
        return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
      }
      if (conflicts.docs.some((doc) => emailChanged && doc.email === email)) {
        return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
      }
    }

    // Update user
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: updateData,
    });

    if (emailChanged) {
      sendVerificationEmail(updatedUser.email, updateData.verificationToken, updatedUser.username).catch((error) => {
        console.error('[update-profile] Failed to send verification email:', error);
      });
    }

    return NextResponse.json({
      message: emailChanged
        ? 'Profile updated. Check your new email address for a verification link.'
        : 'Profile updated successfully',
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
