'use client';

import React from 'react';
import { Card, CardContent } from '@massage/ui';
import { Client } from '@massage/types';

export interface ClientStatsProps {
  client: Client;
}

export const ClientStats: React.FC<ClientStatsProps> = ({ client }) => {
  const stats = [
    {
      label: 'Total Visits',
      value: client.totalVisits || 0,
      icon: '📊',
    },
    {
      label: 'Last Visit',
      value: client.lastVisitDate
        ? new Date(client.lastVisitDate).toLocaleDateString()
        : 'Never',
      icon: '📅',
    },
    {
      label: 'Member Since',
      value: new Date(client.createdAt).toLocaleDateString(),
      icon: '🎉',
    },
    {
      label: 'Status',
      value: client.isActive ? 'Active' : 'Inactive',
      icon: client.isActive ? '✅' : '⏸️',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
