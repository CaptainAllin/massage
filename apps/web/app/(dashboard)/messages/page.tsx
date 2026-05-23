'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@massage/ui';
import { MessageSquare, Search, Send } from 'lucide-react';
import { useConversations, useConversationMessages, useSendMessage, useMarkConversationRead } from '@/lib/hooks';
import { format } from 'date-fns';

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams?.get('businessId') || '';

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations(businessId, {
    search: searchTerm,
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useConversationMessages(
    selectedConversationId || '',
    businessId,
    1,
    50
  );

  // Mutations
  const sendMessageMutation = useSendMessage(businessId);
  const markReadMutation = useMarkConversationRead(businessId);

  const conversations = conversationsData?.data || [];
  const messages = messagesData?.data || [];
  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId) as any;

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    markReadMutation.mutate(conversationId);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation) return;

    try {
      await sendMessageMutation.mutateAsync({
        businessId,
        recipientId: selectedConversation.clientId,
        recipientType: 'CLIENT',
        type: selectedConversation.type,
        content: messageContent,
      });
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!businessId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Messages</h1>
          <p className="text-muted-foreground mt-2">Please select a business first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with your clients via SMS, email, and WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-240px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation: any) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversationId === conversation.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'hover:bg-accent border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-semibold">
                        {conversation.client?.firstName} {conversation.client?.lastName}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessagePreview || 'No messages yet'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conversation.lastMessageAt
                        ? format(new Date(conversation.lastMessageAt), 'MMM d, h:mm a')
                        : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader>
                <CardTitle>
                  {selectedConversation.client?.firstName} {selectedConversation.client?.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.type} conversation
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...messages].reverse().map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.direction === 'OUTBOUND'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent'
                          }`}
                        >
                          {message.subject && (
                            <div className="font-semibold mb-1">{message.subject}</div>
                          )}
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs mt-2 opacity-70">
                            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                            {message.status && (
                              <span className="ml-2">• {message.status}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-500">Loading messages...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}
