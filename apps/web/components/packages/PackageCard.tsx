'use client';

import React from 'react';
import { Card, Badge } from '@massage/ui';
import { PackagePurchase, PackageStatus } from '@massage/types';

export interface PackageCardProps {
  packagePurchase: PackagePurchase;
}

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case PackageStatus.ACTIVE:
      return 'success';
    case PackageStatus.EXPIRED:
    case PackageStatus.FULLY_USED:
      return 'danger';
    case PackageStatus.CANCELLED:
      return 'default';
    default:
      return 'default';
  }
};

export const PackageCard: React.FC<PackageCardProps> = ({ packagePurchase }) => {
  const sessionsRemaining = packagePurchase.totalSessions - packagePurchase.sessionsUsed;
  const progressPercentage = ((packagePurchase.sessionsUsed / packagePurchase.totalSessions) * 100).toFixed(0);

  const isExpired = packagePurchase.expirationDate && new Date() > new Date(packagePurchase.expirationDate);
  const isExpiringSoon = packagePurchase.expirationDate && !isExpired &&
    new Date(packagePurchase.expirationDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {packagePurchase.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ${packagePurchase.totalPrice.toFixed(2)} ({packagePurchase.totalSessions} sessions)
            </p>
          </div>
          <Badge variant={getStatusVariant(packagePurchase.status)}>
            {packagePurchase.status.replace('_', ' ')}
          </Badge>
        </div>

        {packagePurchase.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {packagePurchase.description}
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
                className={`h-2 rounded-full transition-all ${
                  sessionsRemaining === 0 ? 'bg-red-600' : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(100, parseFloat(progressPercentage))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {packagePurchase.sessionsUsed} used of {packagePurchase.totalSessions}
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Purchased: {new Date(packagePurchase.purchasedAt).toLocaleDateString()}</p>
            {packagePurchase.expirationDate && (
              <p className={isExpiringSoon ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''}>
                Expires: {new Date(packagePurchase.expirationDate).toLocaleDateString()}
                {isExpiringSoon && ' (Expiring soon!)'}
              </p>
            )}
          </div>

          {isExpired && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-xs text-red-800 dark:text-red-200">
                This package has expired
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
