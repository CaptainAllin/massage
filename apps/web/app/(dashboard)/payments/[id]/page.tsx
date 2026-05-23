'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Skeleton, Badge } from '@massage/ui';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { usePayment } from '@/lib/hooks/use-payments';
import { RefundPaymentModal } from '@/components/payments/RefundPaymentModal';
import { useRefundPayment } from '@/lib/hooks/use-payments';
import { PaymentStatus, PaymentMethod } from '@massage/types';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;
  const businessId = useBusinessId();

  const { data: payment, isLoading } = usePayment(paymentId, businessId);
  const refundMutation = useRefundPayment(businessId);

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Payment not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const canRefund = payment.status === PaymentStatus.COMPLETED && payment.amount > 0;

  const handleRefund = async (data: { paymentId: string; amount?: number; reason?: string }) => {
    await refundMutation.mutateAsync(data);
    setIsRefundModalOpen(false);
  };

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
              Payment Details
            </h1>
            <p className="text-muted-foreground mt-1">
              Payment ID: {payment.id}
            </p>
          </div>
        </div>
        {canRefund && (
          <Button
            variant="danger"
            onClick={() => setIsRefundModalOpen(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refund Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payment Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Amount" value={`$${payment.amount.toFixed(2)} ${payment.currency}`} />
                <InfoRow label="Status" value={<StatusBadge status={payment.status as PaymentStatus} />} />
                <InfoRow label="Payment Method" value={<MethodBadge method={payment.paymentMethod as PaymentMethod} />} />
                <InfoRow label="Date" value={new Date(payment.createdAt).toLocaleDateString()} />
                {payment.stripePaymentIntentId && (
                  <InfoRow label="Stripe Payment ID" value={payment.stripePaymentIntentId} />
                )}
                {payment.stripeFee && (
                  <InfoRow label="Stripe Fee" value={`$${payment.stripeFee.toFixed(2)}`} />
                )}
                {payment.description && (
                  <div className="col-span-2">
                    <InfoRow label="Description" value={payment.description} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {payment.metadata && Object.keys(payment.metadata).length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="space-y-2">
                  {Object.entries(payment.metadata).map(([key, value]) => (
                    <InfoRow key={key} label={key} value={String(value)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <div className="space-y-4">
                <TimelineItem
                  title="Payment Created"
                  date={new Date(payment.createdAt)}
                />
                {(payment as any).processedAt && (
                  <TimelineItem
                    title="Payment Processed"
                    date={new Date((payment as any).processedAt)}
                  />
                )}
                {(payment as any).refundedAt && (
                  <TimelineItem
                    title="Payment Refunded"
                    date={new Date((payment as any).refundedAt)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Refund Modal */}
      {canRefund && (
        <RefundPaymentModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          onRefund={handleRefund}
          paymentId={payment.id}
          maxAmount={payment.amount}
          currency={payment.currency}
        />
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

function StatusBadge({ status }: { status: PaymentStatus }) {
  const variants: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'default'> = {
    [PaymentStatus.COMPLETED]: 'success',
    [PaymentStatus.PENDING]: 'warning',
    [PaymentStatus.PROCESSING]: 'warning',
    [PaymentStatus.FAILED]: 'danger',
    [PaymentStatus.REFUNDED]: 'default',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'warning',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge variant="default">{method}</Badge>;
}

function TimelineItem({ title, date }: { title: string; date: Date }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{date.toLocaleString()}</p>
      </div>
    </div>
  );
}
