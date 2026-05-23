'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { Plus, Users, TrendingUp, Pause } from 'lucide-react';
import { MembershipList } from '@/components/memberships/MembershipList';
import { CreateMembershipModal } from '@/components/memberships/CreateMembershipModal';
import { useMemberships, useCreateMembershipWithStripe } from '@/lib/hooks/use-memberships';
import { MembershipFilters, CreateMembershipWithStripeDto } from '@massage/types';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function MembershipsPage() {
  const businessId = useBusinessId();
  const [filters] = useState<MembershipFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: membershipsData, isLoading } = useMemberships(businessId, filters);
  const createMutation = useCreateMembershipWithStripe(businessId);

  const handleCreateMembership = async (data: CreateMembershipWithStripeDto) => {
    await createMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  // Calculate stats from memberships data
  const stats = membershipsData?.data
    ? {
        activeMemberships: membershipsData.data.filter((m) => m.status === 'ACTIVE').length,
        totalRevenue: membershipsData.data.reduce((sum, m) => sum + (m.price || 0), 0),
        pausedMemberships: membershipsData.data.filter((m) => m.status === 'PAUSED').length,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Memberships</h1>
          <p className="text-muted-foreground mt-2">
            Manage client memberships and recurring sessions
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Membership
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Memberships</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.activeMemberships}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
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
                  <p className="text-sm font-medium text-gray-600">Paused</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.pausedMemberships}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Pause className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Memberships List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-gray-500">Loading memberships...</p>
        ) : membershipsData?.data && membershipsData.data.length > 0 ? (
          <MembershipList
            memberships={membershipsData.data}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No memberships found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Membership Modal */}
      <CreateMembershipModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMembership}
        businessId={businessId}
      />
    </div>
  );
}
