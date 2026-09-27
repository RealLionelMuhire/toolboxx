"use client";

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Loader2, Trash2 } from 'lucide-react';

import { useTRPC } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { UserAvatar, getUserAvatarUrl } from '@/components/user-avatar';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface Props {
  user: {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    image?: unknown;
  };
}

export function ProfilePictureEditor({ user }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<'upload' | 'remove' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const hasPicture = !!(previewUrl || getUserAvatarUrl(user));

  const refreshSession = () => queryClient.invalidateQueries(trpc.auth.session.queryFilter());

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, WebP, ...)');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setPending('upload');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/users/avatar', { method: 'POST', body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to update profile picture');

      await refreshSession();
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile picture');
    } finally {
      setPreviewUrl(null);
      URL.revokeObjectURL(localPreview);
      setPending(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setPending('remove');
    try {
      const response = await fetch('/api/users/avatar', { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to remove profile picture');

      await refreshSession();
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove profile picture');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <UserAvatar
          user={previewUrl ? { ...user, image: { url: previewUrl } } : user}
          className="h-20 w-20 border"
          fallbackClassName="text-2xl bg-orange-100 text-orange-700"
        />
        {pending === 'upload' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending !== null}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            {hasPicture ? 'Change photo' : 'Upload photo'}
          </Button>
          {hasPicture && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending !== null}
              onClick={handleRemove}
            >
              {pending === 'remove'
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Trash2 className="h-4 w-4 mr-2" />}
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB</p>
      </div>
    </div>
  );
}
