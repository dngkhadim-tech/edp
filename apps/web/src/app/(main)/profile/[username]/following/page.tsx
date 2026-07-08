'use client';

import { useParams } from 'next/navigation';
import { UserListView } from '@/components/profile/UserListView';

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  return (
    <UserListView
      username={username}
      endpoint="following"
      title="Abonnements"
      emptyLabel="Ne suit encore personne"
    />
  );
}
