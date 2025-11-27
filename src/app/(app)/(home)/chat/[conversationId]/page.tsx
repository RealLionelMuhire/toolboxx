import { redirect } from "next/navigation";

import { caller } from "@/trpc/server";
import { ChatView } from "@/modules/chat/ui/views/chat-view";
import { ChatList } from "@/modules/chat/ui/components/chat-list";
import { ErrorBoundary } from "@/components/error-boundary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await caller.auth.session();
  const { conversationId } = await params;

  if (!session.user) {
    redirect("/");
  }

  return (
    <div className="container max-w-7xl mx-auto p-1 sm:p-2 md:p-4 h-[calc(100vh-4rem)] overflow-hidden">
      <div className="border rounded-lg h-full flex overflow-hidden w-full max-w-full">
        {/* Conversation List - Hidden on mobile */}
        <div className="hidden md:block w-80 border-r">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          <ChatList
            currentUserId={session.user.id}
            selectedConversationId={conversationId}
          />
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" data-conversation-id={conversationId}>
          <ErrorBoundary>
            <ChatView
              key={conversationId}
              conversationId={conversationId}
              currentUserId={session.user.id}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
