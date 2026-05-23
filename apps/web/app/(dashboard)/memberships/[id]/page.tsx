'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Skeleton, Badge, Tabs, Tab } from '@massage/ui';
import { ArrowLeft, Pause, Play, XCircle } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  useMembership,
  usePauseMembership,
  useResumeMembership,
  useCancelMembership,
} from '@/lib/hooks/use-memberships';
import { MembershipSessionHistory } from '@/components/memberships/MembershipSessionHistory';
import { MembershipStatus } from '@massage/types';

export default function MembershipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const membershipId = params.id as string;
  const businessId = useBusinessId();

  const { data: membership, isLoading } = useMembership(membershipId, businessId);
  const pauseMutation = usePauseMembership(businessId);
  const resumeMutation = useResumeMembership(businessId);
  const cancelMutation = useCancelMembership(businessId);

  const [activeTab, setActiveTab] = useState('details');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Membership not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const handlePause = async () => {
    if (confirm('Are you sure you want to pause this membership?')) {
      await pauseMutation.mutateAsync(membershipId);
    }
  };

  const handleResume = async () => {
    await resumeMutation.mutateAsync(membershipId);
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this membership? This action cannot be undone.')) {
      await cancelMutation.mutateAsync(membershipId);
    }
  };

  const sessionsRemaining =
    membership.sessionsPerMonth + (membership.rolledOverSessions || 0) - membership.sessionsUsed;
  const progressPercentage =
    ((membership.sessionsUsed / (membership.sessionsPerMonth + (membership.rolledOverSessions || 0))) * 100) || 0;

  const tabs: Tab[] = [
    { id: 'details', label: 'Details' },
    { id: 'sessions', label: 'Session History' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {membership.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Client #{membership.clientId}
            </p>
          </div>
          <StatusBadge status={membership.status as MembershipStatus} />
        </div>
        <div className="flex gap-2">
          {membership.status === MembershipStatus.ACTIVE && (
            <Button variant="secondary" onClick={handlePause}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {membership.status === MembershipStatus.PAUSED && (
            <Button variant="primary" onClick={handleResume}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {membership.status !== MembershipStatus.CANCELLED && (
            <Button variant="danger" onClick={handleCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Membership Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Membership Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Price" value={`$${membership.price?.toFixed(2) || '0.00'}/month`} />
                  <InfoRow label="Status" value={<StatusBadge status={membership.status as MembershipStatus} />} />
                  <InfoRow label="Sessions per Month" value={String(membership.sessionsPerMonth)} />
                  <InfoRow label="Sessions Used" value={String(membership.sessionsUsed)} />
                  <InfoRow label="Sessions Remaining" value={String(sessionsRemaining)} />
                  {membership.rolledOverSessions && membership.rolledOverSessions > 0 && (
                    <InfoRow label="Rolled Over Sessions" value={String(membership.rolledOverSessions)} />
                  )}
                  <InfoRow label="Start Date" value={new Date(membership.startDate).toLocaleDateString()} />
                  {membership.endDate && (
                    <InfoRow label="End Date" value={new Date(membership.endDate).toLocaleDateString()} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Progress */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Session Usage</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {membership.sessionsUsed} of {membership.sessionsPerMonth + (membership.rolledOverSessions || 0)} sessions used
                    </span>
                    <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing Info */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Billing Information</h3>
                <div className="space-y-3">
                  {membership.stripeSubscriptionId && (
                    <InfoRow label="Stripe Subscription" value={membership.stripeSubscriptionId} />
                  )}
                  {membership.stripePriceId && (
                    <InfoRow label="Stripe Price ID" value={membership.stripePriceId} />
                  )}
                  <InfoRow
                    label="Next Billing Date"
                    value={membership.nextBillingDate ? new Date(membership.nextBillingDate).toLocaleDateString() : 'N/A'}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <Card>
          <CardContent className="p-6">
            <MembershipSessionHistory membershipId={membershipId} businessId={businessId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="text-sm text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: MembershipStatus }) {
  const variants: Record<MembershipStatus, 'success' | 'warning' | 'danger' | 'default'> = {
    [MembershipStatus.ACTIVE]: 'success',
    [MembershipStatus.PAUSED]: 'warning',
    [MembershipStatus.CANCELLED]: 'danger',
    [MembershipStatus.EXPIRED]: 'default',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}
