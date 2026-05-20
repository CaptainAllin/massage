import { EmptyState } from '@massage/ui';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with your clients
        </p>
      </div>

      <EmptyState
        icon={<MessageSquare className="h-10 w-10" />}
        title="Messaging coming soon"
        description="SMS and email messaging features will be available in a future update."
      />
    </div>
  );
}
