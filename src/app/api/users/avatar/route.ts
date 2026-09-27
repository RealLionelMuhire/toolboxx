/**
 * Profile picture upload/removal for any signed-in user (buyers included).
 *
 * The general /api/upload endpoint is limited to sellers and admins, so this route
 * accepts images only, normalises them to a small square JPEG, and links the result
 * to the user. The previous picture is deleted so avatars don't pile up in storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import type { Payload } from 'payload';

import { getPayloadSingleton } from '@/lib/payload-singleton';

export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const AVATAR_SIZE = 512;

const getMediaId = (image: unknown): string | null => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return (image as { id?: string }).id ?? null;
};

async function deleteMedia(payload: Payload, mediaId: string | null) {
  if (!mediaId) return;
  try {
    await payload.delete({ collection: 'media', id: mediaId, overrideAccess: true });
  } catch (error) {
    // Losing an old file is not worth failing the request over
    console.error('[Avatar] Failed to delete previous picture:', mediaId, error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadSingleton();
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please upload an image file (JPG, PNG, WebP, ...)' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 });
    }

    let avatar: Buffer;
    try {
      avatar = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    } catch {
      return NextResponse.json({ error: 'This image could not be read. Try another file.' }, { status: 400 });
    }

    const media = await payload.create({
      collection: 'media',
      data: { alt: `${user.username} profile picture` },
      file: {
        data: avatar,
        mimetype: 'image/jpeg',
        name: `avatar-${user.id}-${Date.now()}.jpg`,
        size: avatar.length,
      },
      overrideAccess: true,
    });

    const previousMediaId = getMediaId((user as { image?: unknown }).image);

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { image: media.id } as any,
      overrideAccess: true,
    });

    await deleteMedia(payload, previousMediaId);

    return NextResponse.json({ id: media.id, url: media.url });
  } catch (error) {
    console.error('[Avatar] Upload failed:', error);
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await getPayloadSingleton();
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const previousMediaId = getMediaId((user as { image?: unknown }).image);

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { image: null } as any,
      overrideAccess: true,
    });

    await deleteMedia(payload, previousMediaId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Avatar] Removal failed:', error);
    return NextResponse.json({ error: 'Failed to remove profile picture' }, { status: 500 });
  }
}
