'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { Plus, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { PackageList } from '@/components/packages/PackageList';
import { CreatePackageModal } from '@/components/packages/CreatePackageModal';
import { usePackages, useCreatePackage } from '@/lib/hooks/use-packages';
import { CreatePackagePurchaseDto } from '@massage/types';

type PackageFilters = Record<string, unknown>;

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function PackagesPage() {
  const businessId = useBusinessId();
  const [filters] = useState<PackageFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: packagesData, isLoading } = usePackages(businessId, filters);
  const createMutation = useCreatePackage(businessId);

  const handleCreatePackage = async (data: CreatePackagePurchaseDto) => {
    await createMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  // Calculate stats from packages data
  const stats = packagesData?.data
    ? {
        activePackages: packagesData.data.filter((p) => p.status === 'ACTIVE').length,
        totalRevenue: packagesData.data.reduce((sum, p) => sum + (p.totalPrice || 0), 0),
        expiringPackages: packagesData.data.filter(
          (p) => p.expirationDate && new Date(p.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Session Packages</h1>
          <p className="text-muted-foreground mt-2">
            Manage client session packages and track usage
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Packages</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.activePackages}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.expiringPackages}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Packages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-gray-500">Loading packages...</p>
        ) : packagesData?.data && packagesData.data.length > 0 ? (
          <PackageList
            packages={packagesData.data}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No packages found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Package Modal */}
      <CreatePackageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePackage}
        businessId={businessId}
      />
    </div>
  );
}
