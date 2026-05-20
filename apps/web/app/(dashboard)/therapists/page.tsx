import { EmptyState, Button } from '@massage/ui';
import { UserCog } from 'lucide-react';

export default function TherapistsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Therapists</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team of therapists
          </p>
        </div>
        <Button variant="primary">
          Add Therapist
        </Button>
      </div>

      <EmptyState
        icon={<UserCog className="h-10 w-10" />}
        title="No therapists yet"
        description="Add therapists to your team to manage appointments and client sessions."
        action={
          <Button variant="primary">
            Add Your First Therapist
          </Button>
        }
      />
    </div>
  );
}
