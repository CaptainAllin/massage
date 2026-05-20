'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@massage/ui';
import { useUser } from '@clerk/nextjs';
import { useRole } from '@massage/auth';

export default function DashboardPage() {
  const { user } = useUser();
  const { role } = useRole();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display mb-2">
          Welcome back, {user?.firstName || 'there'}!
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
            <div className="text-3xl font-bold text-foreground font-display">0</div>
            <p className="text-sm text-muted-foreground mt-1">
              No appointments scheduled
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
            <div className="text-3xl font-bold text-foreground font-display">0</div>
            <p className="text-sm text-muted-foreground mt-1">
              Start adding clients
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
            <div className="text-3xl font-bold text-foreground font-display">$0</div>
            <p className="text-sm text-muted-foreground mt-1">
              No revenue yet
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
            <div className="text-3xl font-bold text-foreground font-display">0</div>
            <p className="text-sm text-muted-foreground mt-1">
              All caught up
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

      {/* User Info (for development) */}
      {role && (
        <Card>
          <CardHeader>
            <CardTitle>Your Role: {role}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is a Stage 1 foundation build. Features will be added in subsequent stages.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
