'use client';

import { useParams } from 'next/navigation';
import { UserListView } from '@/components/profile/UserListView';

export default function FollowersPage() {
  const { username } = useParams<{ username: string }>();
  return (
    <UserListView
      username={username}
      endpoint="followers"
      title="Abonnés"
      emptyLabel="Aucun abonné pour le moment"
    />
  );
}
