import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { ChatClient } from '@/components/chat/chat-client';
import { getUserChatRooms } from '@/app/actions/chat';

interface ProviderChatPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProviderChatPage({ searchParams }: ProviderChatPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'provider') {
    redirect('/dashboard');
  }

  // Fetch chat rooms for the provider
  const chatRoomsResult = await getUserChatRooms(session.user.id);
  const chatRooms = chatRoomsResult.success ? chatRoomsResult.data || [] : [];

  // Extract seller ID from query parameters  
  const searchParamsResolved = await searchParams;
  const sellerId = searchParamsResolved.seller as string | undefined;

  return (
    <div className="h-[calc(100vh-12rem)] overflow-hidden">
      <ChatClient
        userRole="provider"
        userId={session.user.id}
        initialChatRooms={chatRooms}
        autoStartWithProviderId={sellerId}
      />
    </div>
  );
}