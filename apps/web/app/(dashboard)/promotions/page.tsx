import { EmptyState } from '@massage/ui';
import { Megaphone } from 'lucide-react';

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Promotions</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage promotional campaigns
        </p>
      </div>

      <EmptyState
        icon={<Megaphone className="h-10 w-10" />}
        title="Promotions coming soon"
        description="Create promotional campaigns and special offers. This feature will be available in a future update."
      />
    </div>
  );
}
