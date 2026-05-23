'use client';

import React from 'react';
import { Membership } from '@massage/types';
import { MembershipCard } from './MembershipCard';

export interface MembershipListProps {
  memberships: Membership[];
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export const MembershipList: React.FC<MembershipListProps> = ({
  memberships,
  onPause,
  onResume,
  onCancel,
}) => {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No memberships found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {memberships.map((membership) => (
        <MembershipCard
          key={membership.id}
          membership={membership}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
};
