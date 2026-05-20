import { EmptyState, Button } from '@massage/ui';
import { ClipboardList } from 'lucide-react';

export default function IntakeFormsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Intake Forms</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage digital intake forms
          </p>
        </div>
        <Button variant="primary">
          Create Form
        </Button>
      </div>

      <EmptyState
        icon={<ClipboardList className="h-10 w-10" />}
        title="No intake forms yet"
        description="Create your first intake form to collect client information before appointments."
        action={
          <Button variant="primary">
            Create Your First Form
          </Button>
        }
      />
    </div>
  );
}
