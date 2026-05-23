'use client';

import React from 'react';
import { Card } from '@massage/ui';
import { PaymentStats as PaymentStatsType } from '@massage/types';

export interface PaymentStatsProps {
  stats: PaymentStatsType;
}

export const PaymentStats: React.FC<PaymentStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            ${stats.totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalPayments} payments
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-2">
            ${stats.totalPending.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.byStatus?.PENDING?.count || 0} pending
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Refunded</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-500 mt-2">
            ${stats.totalRefunded.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total refunds
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Payment</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            ${stats.averagePayment.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Per transaction
          </p>
        </div>
      </Card>
    </div>
  );
};
