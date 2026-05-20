import { EmptyState } from '@massage/ui';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your practice performance
        </p>
      </div>

      <EmptyState
        icon={<BarChart3 className="h-10 w-10" />}
        title="Analytics coming soon"
        description="View detailed insights about your practice performance. This feature will be available in a future update."
      />
    </div>
  );
}
