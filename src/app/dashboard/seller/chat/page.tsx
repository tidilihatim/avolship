import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { ChatClient } from '@/components/chat/chat-client';
import { getUserChatRooms } from '@/app/actions/chat';

interface SellerChatPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SellerChatPage({ searchParams }: SellerChatPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'seller') {
    redirect('/dashboard');
  }

  // Fetch chat rooms for the seller
  const chatRoomsResult = await getUserChatRooms(session.user.id);
  const chatRooms = chatRoomsResult.success ? chatRoomsResult.data || [] : [];

  // Extract provider ID from query parameters  
  const searchParamsResolved = await searchParams;
  const providerId = searchParamsResolved.provider as string | undefined;

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden">
      <ChatClient
        userRole="seller"
        userId={session.user.id}
        initialChatRooms={chatRooms}
        autoStartWithProviderId={providerId}
      />
    </div>
  );
}