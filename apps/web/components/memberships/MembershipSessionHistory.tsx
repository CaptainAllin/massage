'use client';

import React from 'react';
import { Skeleton } from '@massage/ui';
import { useMembership } from '@/lib/hooks/use-memberships';
import { format } from 'date-fns';

interface MembershipSessionHistoryProps {
  membershipId: string;
  businessId: string | undefined;
}

export function MembershipSessionHistory({
  membershipId,
  businessId,
}: MembershipSessionHistoryProps) {
  const { data: membership, isLoading } = useMembership(membershipId, businessId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" height={40} />
        <Skeleton variant="rectangular" height={100} />
      </div>
    );
  }

  const sessions = (membership as any)?.membershipSessions || [];

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No session redemption history found for this membership.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Redeemed Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Appointment ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Appointment Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session: any) => (
              <tr key={session.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(session.redeemedAt || session.createdAt), 'PPpp')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {session.appointmentId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.appointment?.startTime
                    ? format(new Date(session.appointment.startTime), 'PPp')
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    session.appointment?.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {session.appointment?.status || 'REDEEMED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
