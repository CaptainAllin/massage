'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@massage/ui';
import { useAuth } from '@massage/auth';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useClients } from '@/lib/hooks/use-clients';
import { useBusinessId } from '@/lib/hooks/use-business-id';

export default function DashboardPage() {
  const { user } = useAuth();
  const businessId = useBusinessId();

  // Fetch data - get today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(
    businessId || '',
    {
      startDate: today,
      endDate: tomorrow,
    }
  );

  const { data: clientsData, isLoading: clientsLoading } = useClients(
    businessId || '',
    { isActive: true }
  );

  // Calculate stats
  const todaysAppointments = appointmentsData?.data?.length || 0;
  const totalClients = clientsData?.length || 0;
  const isLoading = appointmentsLoading || clientsLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display mb-2">
          Welcome back, {user?.user_metadata?.first_name || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your practice
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {isLoading ? '...' : todaysAppointments}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {todaysAppointments === 0 ? 'No appointments scheduled' : `${todaysAppointments} scheduled today`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {isLoading ? '...' : totalClients}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalClients === 0 ? 'Start adding clients' : `${totalClients} active clients`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">$0</div>
            <p className="text-sm text-muted-foreground mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">0</div>
            <p className="text-sm text-muted-foreground mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-foreground">New Appointment</span>
            </button>

            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="font-medium text-foreground">Add Client</span>
            </button>

            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium text-foreground">Create Form</span>
            </button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
