'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@massage/ui';
import { useClients } from '@/lib/hooks/use-clients';
import { useSendMessage } from '@/lib/hooks/use-messages';
import { Search } from 'lucide-react';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string | undefined;
}

const CHANNEL_OPTIONS = [
  { value: 'SMS', label: '💬 SMS' },
  { value: 'EMAIL', label: '✉️ Email' },
  { value: 'WHATSAPP', label: '📱 WhatsApp' },
];

export const NewMessageModal: React.FC<NewMessageModalProps> = ({ isOpen, onClose, businessId }) => {
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [messageType, setMessageType] = useState('SMS');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const { data: clients } = useClients(businessId, { search: clientSearch, limit: 20 });
  const sendMessage = useSendMessage(businessId);

  const handleSelectClient = (client: any) => {
    setSelectedClientId(client.id);
    setClientSearch(`${client.firstName} ${client.lastName}`);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!selectedClientId || !content.trim() || !businessId) return;
    try {
      await sendMessage.mutateAsync({
        businessId,
        recipientId: selectedClientId,
        recipientType: 'CLIENT',
        type: messageType,
        subject: messageType === 'EMAIL' ? subject : undefined,
        content,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleClose = () => {
    setClientSearch('');
    setSelectedClientId('');
    setShowDropdown(false);
    setMessageType('SMS');
    setSubject('');
    setContent('');
    onClose();
  };

  const filteredClients = clients || [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Message" size="md">
      <div className="space-y-4">
        {/* Client search */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1E1830' }}>To</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setSelectedClientId('');
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-9 text-sm"
            />
            {showDropdown && clientSearch && filteredClients.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-[#EFE9F2] rounded-xl shadow-md max-h-48 overflow-y-auto">
                {filteredClients.map((client: any) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F3EFFD] transition-colors"
                    style={{ color: '#1E1830' }}
                    onMouseDown={() => handleSelectClient(client)}
                  >
                    <span className="font-medium">{client.firstName} {client.lastName}</span>
                    {client.email && <span className="ml-2 text-xs" style={{ color: '#7A7090' }}>{client.email}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Channel type */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1E1830' }}>Channel</label>
          <div className="flex gap-2">
            {CHANNEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMessageType(opt.value)}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all border"
                style={
                  messageType === opt.value
                    ? { background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff', borderColor: 'transparent' }
                    : { background: '#F9F7FD', color: '#5D4AA8', borderColor: '#EFE9F2' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject (email only) */}
        {messageType === 'EMAIL' && (
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1E1830' }}>Subject</label>
            <Input
              placeholder="Enter subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        {/* Message content */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1E1830' }}>Message</label>
          <Textarea
            placeholder="Type your message..."
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            rows={4}
            className="text-sm resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedClientId || !content.trim() || sendMessage.isPending}
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}
          >
            {sendMessage.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
