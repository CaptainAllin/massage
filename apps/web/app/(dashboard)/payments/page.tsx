import { EmptyState } from '@massage/ui';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Payments</h1>
        <p className="text-muted-foreground mt-2">
          Manage payments and invoices
        </p>
      </div>

      <EmptyState
        icon={<CreditCard className="h-10 w-10" />}
        title="Payment processing coming soon"
        description="Accept payments and manage invoices. This feature will be available in a future update."
      />
    </div>
  );
}
