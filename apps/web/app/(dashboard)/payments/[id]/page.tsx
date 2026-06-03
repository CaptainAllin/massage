'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Skeleton, Badge } from '@massage/ui';
import { ArrowLeft, RefreshCw, User, Phone, Mail, Calendar, Clock, Stethoscope, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePayment } from '@/lib/hooks/use-payments';
import { RefundPaymentModal } from '@/components/payments/RefundPaymentModal';
import { useRefundPayment } from '@/lib/hooks/use-payments';
import { PaymentStatus, PaymentMethod } from '@massage/types';

import { useBusinessId } from '@/lib/hooks/use-business-id';
import { formatCurrency } from '@/lib/format';

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
  const client = (payment as any).client;
  const appointment = (payment as any).appointment;
  const therapist = appointment?.therapist;
  const therapistUser = therapist?.user;
  const therapistName = therapistUser
    ? `${therapistUser.firstName || ''} ${therapistUser.lastName || ''}`.trim()
    : null;

  const handleRefund = async (data: { paymentId: string; amount?: number; reason?: string }) => {
    await refundMutation.mutateAsync({ ...data, businessId } as any);
    setIsRefundModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {client ? `${client.firstName} ${client.lastName}` : 'Payment Details'}
            </h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm truncate max-w-[220px] sm:max-w-none">
              ID: {payment.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {client && (
            <Link href={`/clients?id=${client.id}`}>
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                View Client
                <ExternalLink className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
              </Button>
            </Link>
          )}
          {canRefund && (
            <Button variant="danger" onClick={() => setIsRefundModalOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refund Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Amount" value={formatCurrency(payment.amount, payment.currency || 'AUD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <InfoRow label="Status" value={<StatusBadge status={payment.status as PaymentStatus} />} />
                <InfoRow label="Payment Method" value={<MethodBadge method={payment.paymentMethod as PaymentMethod} />} />
                <InfoRow label="Date" value={new Date(payment.createdAt).toLocaleDateString()} />
                {payment.stripePaymentIntentId && (
                  <InfoRow label="Stripe Payment ID" value={payment.stripePaymentIntentId} />
                )}
                {payment.stripeFee != null && payment.stripeFee > 0 && (
                  <InfoRow label="Stripe Fee" value={formatCurrency(payment.stripeFee, payment.currency || 'AUD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                )}
                {payment.notes && (
                  <div className="col-span-2">
                    <InfoRow label="Notes" value={payment.notes} />
                  </div>
                )}
                {payment.description && (
                  <div className="col-span-2">
                    <InfoRow label="Description" value={payment.description} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Info */}
          {client && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Client</h3>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#EDE5F4] flex items-center justify-center text-[#5D4AA8] font-semibold text-sm flex-shrink-0">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-sm">
                      {client.firstName} {client.lastName}
                    </p>
                    {client.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
                      </p>
                    )}
                    {client.phoneNumber && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${client.phoneNumber}`} className="hover:underline">{client.phoneNumber}</a>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment / Service Details */}
          {appointment && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Appointment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {appointment.serviceType && (
                    <InfoRow
                      label="Service"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                          {appointment.serviceType}
                        </span>
                      }
                    />
                  )}
                  {therapistName && (
                    <InfoRow
                      label="Therapist"
                      value={
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {therapistName}
                        </span>
                      }
                    />
                  )}
                  <InfoRow
                    label="Date & Time"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(appointment.startTime).toLocaleString()}
                      </span>
                    }
                  />
                  {appointment.duration && (
                    <InfoRow
                      label="Duration"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {appointment.duration} min
                        </span>
                      }
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                <TimelineItem title="Payment Created" date={new Date(payment.createdAt)} />
                {(payment as any).paidAt && (
                  <TimelineItem title="Payment Completed" date={new Date((payment as any).paidAt)} />
                )}
                {(payment as any).refundedAt && (
                  <TimelineItem title="Payment Refunded" date={new Date((payment as any).refundedAt)} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {canRefund && (
        <RefundPaymentModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          onRefund={handleRefund}
          paymentId={payment.id}
          maxAmount={payment.amount - ((payment as any).refundedAmount || 0)}
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
