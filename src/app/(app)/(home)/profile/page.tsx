import ProfilePageClient from './profile-client';

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function ProfilePage() {
  return <ProfilePageClient />;
}
