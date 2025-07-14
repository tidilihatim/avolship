'use client';

import { useSession } from 'next-auth/react';

export default function DebugPage() {
  const { data: session } = useSession();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <div className="space-y-2">
        <p><strong>User ID:</strong> {session?.user?.id || 'Not logged in'}</p>
        <p><strong>User Name:</strong> {session?.user?.name || 'N/A'}</p>
        <p><strong>User Email:</strong> {session?.user?.email || 'N/A'}</p>
        <p><strong>User Role:</strong> {session?.user?.role || 'N/A'}</p>
      </div>
    </div>
  );
}