'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@massage/ui';
import { Plus, TrendingUp, DollarSign, RefreshCw, BarChart2, Scale } from 'lucide-react';
import { PaymentsList } from '@/components/payments/PaymentsList';
import { CreatePaymentModal } from '@/components/payments/CreatePaymentModal';
import { usePayments, usePaymentStats } from '@/lib/hooks/use-payments';
import { PaymentFilters, PaymentStatus } from '@massage/types';

import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness } from '@/lib/hooks/use-business';
import { formatCurrency } from '@/lib/format';
import { PaymentsTour } from '@/components/payments/PaymentsTour';
export default function PaymentsPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: paymentsData, isLoading, refetch } = usePayments(businessId, filters);
  const { data: stats, refetch: refetchStats } = usePaymentStats(businessId);
  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'AUD';

  const handleFilterChange = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
  };

  const handlePaymentSuccess = () => {
    refetch();
    refetchStats();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Operations</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Payments</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            Manage payments, invoices, and track revenue
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/payments/revenue-report')}>
            <BarChart2 className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Revenue Reports</span>
            <span className="sm:hidden">Revenue</span>
          </Button>
          <Button variant="outline" onClick={() => router.push('/payments/reconciliation')}>
            <Scale className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Reconciliation</span>
            <span className="sm:hidden">Reconcile</span>
          </Button>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Process Payment</span>
            <span className="sm:hidden">Process</span>
          </Button>
        </div>
      </div>

      {/* Onboarding tour */}
      <PaymentsTour />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalRevenue, currency)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalPending, currency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.byStatus?.[PaymentStatus.PENDING]?.count || 0} payments
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Refunded</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalRefunded, currency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.byStatus?.[PaymentStatus.REFUNDED]?.count || 0} refunds
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments List */}
      <Card>
        <CardContent className="p-6">
          <PaymentsList
            payments={paymentsData?.data || []}
            isLoading={isLoading}
            onFilterChange={handleFilterChange}
          />
        </CardContent>
      </Card>

      {businessId && (
        <CreatePaymentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          businessId={businessId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
