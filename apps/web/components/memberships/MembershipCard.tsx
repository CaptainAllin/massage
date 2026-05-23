'use client';

import React from 'react';
import { Card, Badge, Button } from '@massage/ui';
import { Membership, MembershipStatus } from '@massage/types';

export interface MembershipCardProps {
  membership: Membership;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case MembershipStatus.ACTIVE:
      return 'success';
    case MembershipStatus.PAUSED:
      return 'warning';
    case MembershipStatus.CANCELLED:
    case MembershipStatus.EXPIRED:
      return 'danger';
    default:
      return 'default';
  }
};

export const MembershipCard: React.FC<MembershipCardProps> = ({
  membership,
  onPause,
  onResume,
  onCancel,
}) => {
  const sessionsRemaining = membership.sessionsPerMonth + membership.rolledOverSessions - membership.sessionsUsed;
  const progressPercentage = ((membership.sessionsUsed / (membership.sessionsPerMonth + membership.rolledOverSessions)) * 100).toFixed(0);

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {membership.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ${membership.price.toFixed(2)} / month
            </p>
          </div>
          <Badge variant={getStatusVariant(membership.status)}>
            {membership.status}
          </Badge>
        </div>

        {membership.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {membership.description}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Sessions</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {sessionsRemaining} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, parseFloat(progressPercentage))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {membership.sessionsUsed} used of {membership.sessionsPerMonth}
              {membership.rolledOverSessions > 0 && ` (+${membership.rolledOverSessions} rolled over)`}
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Billing cycle: {new Date(membership.billingCycleStart).toLocaleDateString()} - {new Date(membership.billingCycleEnd).toLocaleDateString()}</p>
            {membership.nextBillingDate && (
              <p>Next billing: {new Date(membership.nextBillingDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {membership.status === MembershipStatus.ACTIVE && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause(membership.id)}
              >
                Pause
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(membership.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {membership.status === MembershipStatus.PAUSED && onResume && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onResume(membership.id)}
            >
              Resume
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
