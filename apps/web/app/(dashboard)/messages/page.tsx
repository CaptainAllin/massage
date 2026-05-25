'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@massage/ui';
import { MessageSquare, Search, Send, Plus } from 'lucide-react';
import { useConversations, useConversationMessages, useSendMessage, useMarkConversationRead } from '@/lib/hooks';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { CommunicationsTour } from '@/components/communications/CommunicationsTour';
import { format } from 'date-fns';

const CHANNEL_ICONS: Record<string, string> = {
  EMAIL: '✉️',
  SMS: '💬',
  WHATSAPP: '📱',
};

export default function MessagesPage() {
  const businessId = useBusinessId();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: conversationsData, isLoading: conversationsLoading } = useConversations(businessId, {
    search: searchTerm,
  });

  const { data: messagesData, isLoading: messagesLoading } = useConversationMessages(
    selectedConversationId || '',
    businessId,
    1,
    50
  );

  const sendMessageMutation = useSendMessage(businessId);
  const markReadMutation = useMarkConversationRead(businessId);

  const conversations = conversationsData?.data || [];
  const messages = messagesData?.data || [];
  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId) as any;

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    markReadMutation.mutate(conversationId);
  };

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
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Communications</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Messages</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CommunicationsTour />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Communications</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Messages</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Communicate with your clients via SMS, Email, and WhatsApp</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => {}}>
          <Plus className="h-4 w-4 mr-1" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 pt-0">
            {conversationsLoading ? (
              <div className="text-center text-muted-foreground py-8 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-1">Send a message to a client to start a thread</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {conversations.map((conversation: any) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className="w-full text-left p-3 rounded-xl transition-all"
                    style={
                      selectedConversationId === conversation.id
                        ? { background: 'linear-gradient(135deg, #F3EFFD, #EDE5F4)', border: '1.5px solid rgba(93,74,168,0.3)' }
                        : { background: 'transparent', border: '1.5px solid transparent' }
                    }
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs flex-shrink-0">{CHANNEL_ICONS[conversation.type] ?? '💬'}</span>
                        <span className="font-medium text-sm truncate" style={{ color: '#1E1830' }}>
                          {conversation.client?.firstName} {conversation.client?.lastName}
                        </span>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span
                          className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: '#5D4AA8', color: '#fff' }}
                        >
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#7A7090' }}>
                      {conversation.lastMessagePreview || 'No messages yet'}
                    </p>
                    {conversation.lastMessageAt && (
                      <p className="text-xs mt-0.5" style={{ color: '#9E96B0' }}>
                        {format(new Date(conversation.lastMessageAt), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3" style={{ borderBottom: '1px solid #F0EBF8' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{CHANNEL_ICONS[selectedConversation.type] ?? '💬'}</span>
                  <div>
                    <CardTitle className="text-base">
                      {selectedConversation.client?.firstName} {selectedConversation.client?.lastName}
                    </CardTitle>
                    <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
                      {selectedConversation.type} conversation
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation below</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...messages].reverse().map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className="max-w-[72%] rounded-2xl px-4 py-2.5"
                          style={
                            message.direction === 'OUTBOUND'
                              ? { background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }
                              : { background: '#F3EFFD', color: '#1E1830' }
                          }
                        >
                          {message.subject && (
                            <p className="text-xs font-semibold mb-1 opacity-80">{message.subject}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs mt-1.5 opacity-60">
                            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                            {message.status && ` · ${message.status}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="p-4" style={{ borderTop: '1px solid #F0EBF8' }}>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                    style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: '#9E96B0' }}>Press Enter to send · Shift+Enter for a new line</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center" style={{ color: '#9E96B0' }}>
                <MessageSquare className="h-14 w-14 mx-auto mb-4 opacity-30" />
                <p className="font-medium text-sm">Select a conversation to view messages</p>
                <p className="text-xs mt-1">Or start a new thread with a client</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
