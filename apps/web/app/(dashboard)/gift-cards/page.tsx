'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import {
  Gift,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useGiftCards, useCreateGiftCard, useRedeemGiftCard } from '@/lib/hooks/use-gift-cards';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness } from '@/lib/hooks/use-business';
import { useClients } from '@/lib/hooks/use-clients';
import { formatCurrency as fmtCurrency } from '@/lib/format';

function GiftCardBadge({ isActive, balance }: { isActive: boolean; balance: number }) {
  if (!isActive || balance === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <XCircle className="w-3 h-3" /> Used
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDE5F4] text-[#5D4AA8]">
      <CheckCircle className="w-3 h-3" /> Active
    </span>
  );
}

function CreateGiftCardModal({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    amount: '',
    recipientName: '',
    recipientEmail: '',
    note: '',
    expiresAt: '',
    purchasedById: '',
  });
  const createGiftCard = useCreateGiftCard(businessId);
  const { data: clientsData } = useClients(businessId);
  const clients = (clientsData as any)?.clients ?? clientsData ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGiftCard.mutateAsync({
      amount: parseFloat(form.amount),
      recipientName: form.recipientName || undefined,
      recipientEmail: form.recipientEmail || undefined,
      note: form.note || undefined,
      expiresAt: form.expiresAt || undefined,
      purchasedById: form.purchasedById || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Issue Gift Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
              placeholder="50.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
            <input
              type="text"
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
            <input
              type="email"
              value={form.recipientEmail}
              onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchased By (Client)</label>
            <select
              value={form.purchasedById}
              onChange={(e) => setForm({ ...form, purchasedById: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
            >
              <option value="">— Select client —</option>
              {Array.isArray(clients) && clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
              placeholder="Happy Birthday!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={createGiftCard.isPending} className="flex-1">
              {createGiftCard.isPending ? 'Issuing...' : 'Issue Gift Card'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RedeemModal({
  giftCard,
  businessId,
  onClose,
}: {
  giftCard: any;
  businessId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const redeemGiftCard = useRedeemGiftCard(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await redeemGiftCard.mutateAsync({ id: giftCard.id, amount: parseFloat(amount) });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Redeem Gift Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          <div className="mb-4 p-3 bg-[#EDE5F4] rounded-lg text-sm">
            <p className="font-mono text-lg font-bold text-[#5D4AA8]">{giftCard.code}</p>
            <p className="text-[#7665C2] mt-1">Available balance: {fmtCurrency(giftCard.balance, 'AUD')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Redemption Amount ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={giftCard.balance}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
              <Button variant="primary" type="submit" disabled={redeemGiftCard.isPending} className="flex-1">
                {redeemGiftCard.isPending ? 'Redeeming...' : 'Redeem'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function GiftCardsPage() {
  const businessId = useBusinessId();
  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'AUD';
  const formatCurrency = (amount: number) => fmtCurrency(amount, currency);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [redeemCard, setRedeemCard] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');

  const { data: giftCards = [], isLoading } = useGiftCards(businessId, {});

  const filtered = (giftCards as any[]).filter((gc: any) => {
    const matchesSearch =
      !search ||
      gc.code.toLowerCase().includes(search.toLowerCase()) ||
      (gc.recipientName && gc.recipientName.toLowerCase().includes(search.toLowerCase())) ||
      (gc.recipientEmail && gc.recipientEmail.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && gc.isActive && gc.balance > 0) ||
      (filter === 'used' && (!gc.isActive || gc.balance === 0));
    return matchesSearch && matchesFilter;
  });

  const totalIssued = (giftCards as any[]).reduce((s: number, gc: any) => s + gc.originalAmount, 0);
  const totalOutstanding = (giftCards as any[]).filter((gc: any) => gc.isActive).reduce((s: number, gc: any) => s + gc.balance, 0);
  const totalRedeemed = totalIssued - totalOutstanding;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Gift Cards</h1>
          <p className="text-muted-foreground mt-1">Issue and manage gift cards for your clients</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Issue Gift Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Issued</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalIssued)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Redeemed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRedeemed)}</p>
              </div>
              <div className="h-12 w-12 bg-[#EDE5F4] rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-[#5D4AA8]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, recipient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-\[#5D4AA8\]"
              />
            </div>
            <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
              {(['all', 'active', 'used'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-sm font-medium capitalize transition-colors ${
                    filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No gift cards found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Recipient</th>
                    <th className="pb-3 font-medium">Original</th>
                    <th className="pb-3 font-medium">Balance</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Expires</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((gc: any) => (
                    <tr key={gc.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-gray-900">{gc.code}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{gc.recipientName || <span className="text-gray-400">—</span>}</div>
                        {gc.recipientEmail && <div className="text-xs text-gray-400">{gc.recipientEmail}</div>}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{formatCurrency(gc.originalAmount)}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{formatCurrency(gc.balance)}</td>
                      <td className="py-3 pr-4">
                        <GiftCardBadge isActive={gc.isActive} balance={gc.balance} />
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3">
                        {gc.isActive && gc.balance > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setRedeemCard(gc)}>
                            Redeem
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isCreateOpen && businessId && (
        <CreateGiftCardModal businessId={businessId} onClose={() => setIsCreateOpen(false)} />
      )}
      {redeemCard && businessId && (
        <RedeemModal giftCard={redeemCard} businessId={businessId} onClose={() => setRedeemCard(null)} />
      )}
    </div>
  );
}
