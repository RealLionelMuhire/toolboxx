"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the client component to avoid SSR issues
const ProfilePageClient = dynamic(() => import('./profile-client'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfilePageClient />;
}
