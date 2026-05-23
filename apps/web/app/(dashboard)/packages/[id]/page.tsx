'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Skeleton, Badge, Tabs, Tab } from '@massage/ui';
import { ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';
import { usePackage } from '@/lib/hooks/use-packages';
import { PackageSessionHistory } from '@/components/packages/PackageSessionHistory';
import { PackageStatus } from '@massage/types';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;
  const businessId = useBusinessId();

  const { data: packagePurchase, isLoading } = usePackage(packageId, businessId);

  const [activeTab, setActiveTab] = useState('details');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (!packagePurchase) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Package not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const sessionsRemaining = packagePurchase.totalSessions - packagePurchase.sessionsUsed;
  const progressPercentage = ((packagePurchase.sessionsUsed / packagePurchase.totalSessions) * 100) || 0;

  const daysUntilExpiration = packagePurchase.expirationDate
    ? Math.ceil((new Date(packagePurchase.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration > 0 && daysUntilExpiration <= 30;
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration <= 0;

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
            <h1 className="text-3xl font-bold text-foreground font-display">
              {packagePurchase.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Client #{packagePurchase.clientId}
            </p>
          </div>
          <StatusBadge status={packagePurchase.status as PackageStatus} />
        </div>
      </div>

      {/* Expiration Warning */}
      {isExpiringSoon && !isExpired && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Package expiring soon
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This package will expire in {daysUntilExpiration} days on{' '}
              {new Date(packagePurchase.expirationDate!).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">
              Package expired
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              This package expired on {new Date(packagePurchase.expirationDate!).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Package Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Package Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Total Price" value={`$${packagePurchase.totalPrice?.toFixed(2) || '0.00'}`} />
                  <InfoRow label="Status" value={<StatusBadge status={packagePurchase.status as PackageStatus} />} />
                  <InfoRow label="Total Sessions" value={String(packagePurchase.totalSessions)} />
                  <InfoRow label="Sessions Used" value={String(packagePurchase.sessionsUsed)} />
                  <InfoRow label="Sessions Remaining" value={String(sessionsRemaining)} />
                  <InfoRow label="Purchase Date" value={new Date(packagePurchase.purchasedAt).toLocaleDateString()} />
                  {packagePurchase.expirationDate && (
                    <InfoRow
                      label="Expiration Date"
                      value={
                        <div className="flex items-center gap-2">
                          <span>{new Date(packagePurchase.expirationDate).toLocaleDateString()}</span>
                          {isExpiringSoon && !isExpired && (
                            <Badge variant="warning">
                              {daysUntilExpiration}d left
                            </Badge>
                          )}
                        </div>
                      }
                    />
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
                      {packagePurchase.sessionsUsed} of {packagePurchase.totalSessions} sessions used
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

          {/* Additional Info */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Package Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Purchased {new Date(packagePurchase.purchasedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {packagePurchase.description && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 font-medium mb-1">Description</p>
                      <p className="text-sm text-gray-900">{packagePurchase.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <Card>
          <CardContent className="p-6">
            <PackageSessionHistory packageId={packageId} businessId={businessId} />
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

function StatusBadge({ status }: { status: PackageStatus }) {
  const variants: Record<PackageStatus, 'success' | 'warning' | 'danger' | 'default'> = {
    [PackageStatus.ACTIVE]: 'success',
    [PackageStatus.EXPIRED]: 'danger',
    [PackageStatus.FULLY_USED]: 'default',
    [PackageStatus.CANCELLED]: 'default',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}
