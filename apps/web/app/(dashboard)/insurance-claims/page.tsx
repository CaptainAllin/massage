'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import {
  ShieldCheck, Plus, Edit2, Trash2, FileText, DollarSign,
  CheckCircle, Clock, XCircle, AlertCircle, Building2, X,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  useInsuranceProviders, useCreateInsuranceProvider, useUpdateInsuranceProvider, useDeleteInsuranceProvider,
  useInsuranceClaims, useCreateInsuranceClaim, useUpdateInsuranceClaim, useDeleteInsuranceClaim,
  useClaimReimbursements, useCreateReimbursement,
} from '@/lib/hooks/use-insurance';
import { useClients } from '@/lib/hooks/use-clients';

const CLAIM_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-[#EFE9F2] text-[#7A7090]',
  SUBMITTED: 'bg-[#EDE5F4] text-[#5D4AA8]',
  PENDING: 'bg-[#F7E5DD] text-[#C97E68]',
  APPROVED: 'bg-[#EDE5F4] text-[#5D4AA8]',
  DENIED: 'bg-red-100 text-red-700',
  APPEALING: 'bg-[#F7E5DD] text-[#C97E68]',
  PAID: 'bg-[#EDE5F4] text-[#5D4AA8]',
  VOID: 'bg-[#EFE9F2] text-[#7A7090]',
};

const CLAIM_STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <Clock className="w-3.5 h-3.5" />,
  SUBMITTED: <FileText className="w-3.5 h-3.5" />,
  PENDING: <Clock className="w-3.5 h-3.5" />,
  APPROVED: <CheckCircle className="w-3.5 h-3.5" />,
  DENIED: <XCircle className="w-3.5 h-3.5" />,
  APPEALING: <AlertCircle className="w-3.5 h-3.5" />,
  PAID: <DollarSign className="w-3.5 h-3.5" />,
  VOID: <XCircle className="w-3.5 h-3.5" />,
};

// ---- Provider Modal ----
function ProviderModal({ businessId, provider, onClose }: { businessId: string; provider?: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: provider?.name ?? '',
    payerId: provider?.payerId ?? '',
    address: provider?.address ?? '',
    city: provider?.city ?? '',
    state: provider?.state ?? '',
    postalCode: provider?.postalCode ?? '',
    phone: provider?.phone ?? '',
    fax: provider?.fax ?? '',
    portalUrl: provider?.portalUrl ?? '',
    claimsEmail: provider?.claimsEmail ?? '',
    notes: provider?.notes ?? '',
  });
  const create = useCreateInsuranceProvider(businessId);
  const update = useUpdateInsuranceProvider(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (provider) {
      await update.mutateAsync({ id: provider.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{provider ? 'Edit Provider' : 'Add Insurance Provider'}</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.name} onChange={f('name')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payer ID</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.payerId} onChange={f('payerId')} placeholder="e.g. 00901" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.phone} onChange={f('phone')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fax</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.fax} onChange={f('fax')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Claims Email</label>
                <input type="email" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.claimsEmail} onChange={f('claimsEmail')} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.address} onChange={f('address')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.city} onChange={f('city')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.state} onChange={f('state')} maxLength={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.postalCode} onChange={f('postalCode')} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Portal URL</label>
                <input type="url" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.portalUrl} onChange={f('portalUrl')} placeholder="https://" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} value={form.notes} onChange={f('notes')} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {provider ? 'Save Changes' : 'Add Provider'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- New Claim Modal ----
function NewClaimModal({ businessId, providers, clients, onClose }: { businessId: string; providers: any[]; clients: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    clientId: '',
    insuranceProviderId: '',
    subscriberName: '',
    subscriberPolicyNumber: '',
    groupNumber: '',
    relationshipToSubscriber: 'SELF',
    renderingProviderName: '',
    renderingProviderNPI: '',
    billingProviderName: '',
    billingProviderNPI: '',
    billingProviderTaxId: '',
    totalCharge: '',
    claimedAmount: '',
    diagnosisCodes: '',
    notes: '',
  });
  const create = useCreateInsuranceClaim(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const diagCodes = form.diagnosisCodes
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    await create.mutateAsync({
      ...form,
      diagnosisCodes: diagCodes,
      procedureCodes: [],
      totalCharge: parseFloat(form.totalCharge) || 0,
      claimedAmount: parseFloat(form.claimedAmount) || 0,
    });
    onClose();
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">New Insurance Claim</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Client *</label>
                <select className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.clientId} onChange={f('clientId')} required>
                  <option value="">Select client...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Insurance Provider *</label>
                <select className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.insuranceProviderId} onChange={f('insuranceProviderId')} required>
                  <option value="">Select provider...</option>
                  {providers.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subscriber Name</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.subscriberName} onChange={f('subscriberName')} placeholder="If different from patient" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relationship</label>
                <select className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.relationshipToSubscriber} onChange={f('relationshipToSubscriber')}>
                  <option value="SELF">Self</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="CHILD">Child</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Policy Number</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.subscriberPolicyNumber} onChange={f('subscriberPolicyNumber')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Group Number</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.groupNumber} onChange={f('groupNumber')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Charge ($)</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.totalCharge} onChange={f('totalCharge')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Claimed Amount ($)</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.claimedAmount} onChange={f('claimedAmount')} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Diagnosis Codes (ICD-10, comma-separated)</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.diagnosisCodes} onChange={f('diagnosisCodes')} placeholder="e.g. M54.5, Z96.641" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rendering Provider</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.renderingProviderName} onChange={f('renderingProviderName')} placeholder="Therapist name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NPI</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.renderingProviderNPI} onChange={f('renderingProviderNPI')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Provider</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.billingProviderName} onChange={f('billingProviderName')} placeholder="Business name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax ID (EIN)</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.billingProviderTaxId} onChange={f('billingProviderTaxId')} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} value={form.notes} onChange={f('notes')} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>Create Claim</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Reimbursement Modal ----
function ReimbursementModal({ businessId, claim, onClose }: { businessId: string; claim: any; onClose: () => void }) {
  const [form, setForm] = useState({
    checkNumber: '',
    eobNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amountBilled: String(claim.claimedAmount ?? ''),
    amountAllowed: '',
    amountPaid: '',
    patientResponsibility: '',
    notes: '',
  });
  const create = useCreateReimbursement(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      claimId: claim.id,
      checkNumber: form.checkNumber || undefined,
      eobNumber: form.eobNumber || undefined,
      paymentDate: form.paymentDate,
      amountBilled: parseFloat(form.amountBilled) || 0,
      amountAllowed: parseFloat(form.amountAllowed) || 0,
      amountPaid: parseFloat(form.amountPaid) || 0,
      patientResponsibility: parseFloat(form.patientResponsibility) || 0,
      notes: form.notes || undefined,
    });
    onClose();
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Record Reimbursement</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Claim: {claim.claimNumber}</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Check / EFT Number</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.checkNumber} onChange={f('checkNumber')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">EOB Number</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.eobNumber} onChange={f('eobNumber')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Date *</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.paymentDate} onChange={f('paymentDate')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount Billed ($)</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.amountBilled} onChange={f('amountBilled')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount Allowed ($)</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.amountAllowed} onChange={f('amountAllowed')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount Paid ($) *</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.amountPaid} onChange={f('amountPaid')} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Patient Responsibility ($)</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.patientResponsibility} onChange={f('patientResponsibility')} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} value={form.notes} onChange={f('notes')} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>Record Payment</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Providers Tab ----
function ProvidersTab({ businessId }: { businessId: string }) {
  const { data, isLoading } = useInsuranceProviders(businessId);
  const deleteProvider = useDeleteInsuranceProvider(businessId);
  const [showModal, setShowModal] = useState(false);
  const [editProvider, setEditProvider] = useState<any>(null);

  const providers = data?.providers ?? [];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading providers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{providers.length} provider{providers.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => { setEditProvider(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Provider
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No insurance providers added yet.</p>
          <p className="text-xs mt-1">Add providers to start creating claims.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {providers.map((provider: any) => (
            <Card key={provider.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{provider.name}</h3>
                      {provider.payerId && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">ID: {provider.payerId}</span>
                      )}
                      {!provider.isActive && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {provider.phone && <span>{provider.phone}</span>}
                      {provider.claimsEmail && <span>{provider.claimsEmail}</span>}
                      {(provider.city || provider.state) && (
                        <span>{[provider.city, provider.state].filter(Boolean).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditProvider(provider); setShowModal(true); }}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${provider.name}?`)) deleteProvider.mutate(provider.id); }}
                      className="p-1.5 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <ProviderModal
          businessId={businessId}
          provider={editProvider}
          onClose={() => { setShowModal(false); setEditProvider(null); }}
        />
      )}
    </div>
  );
}

// ---- Claims Tab ----
function ClaimsTab({ businessId, providers, clients }: { businessId: string; providers: any[]; clients: any[] }) {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useInsuranceClaims(businessId, statusFilter ? { status: statusFilter } : undefined);
  const updateClaim = useUpdateInsuranceClaim(businessId);
  const deleteClaim = useDeleteInsuranceClaim(businessId);
  const [showNewModal, setShowNewModal] = useState(false);
  const [reimbursementClaim, setReimbursementClaim] = useState<any>(null);

  const claims = data?.claims ?? [];

  const handleStatusChange = async (claim: any, newStatus: string) => {
    await updateClaim.mutateAsync({ id: claim.id, status: newStatus });
  };

  const statuses = ['', 'DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'DENIED', 'APPEALING', 'PAID', 'VOID'];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading claims...</div>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowNewModal(true)} disabled={providers.length === 0}>
          <Plus className="w-4 h-4 mr-1" /> New Claim
        </Button>
      </div>

      {providers.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Add at least one insurance provider before creating claims.
        </div>
      )}

      {claims.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No claims found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim: any) => {
            const totalPaid = claim.reimbursements?.reduce((s: number, r: any) => s + (r.amountPaid ?? 0), 0) ?? 0;
            return (
              <Card key={claim.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">{claim.claimNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CLAIM_STATUS_STYLES[claim.status]}`}>
                          {CLAIM_STATUS_ICONS[claim.status]}
                          {claim.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {claim.client?.firstName} {claim.client?.lastName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{claim.insuranceProvider?.name}</span>
                        {claim.subscriberPolicyNumber && <span>Policy: {claim.subscriberPolicyNumber}</span>}
                        {claim.claimedAmount > 0 && <span>Claimed: ${claim.claimedAmount.toFixed(2)}</span>}
                        {totalPaid > 0 && <span className="text-emerald-600">Paid: ${totalPaid.toFixed(2)}</span>}
                        {claim.submittedAt && (
                          <span>Submitted: {new Date(claim.submittedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {(claim.diagnosisCodes as string[])?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(claim.diagnosisCodes as string[]).map((code: string) => (
                            <span key={code} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{code}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 flex-col items-end">
                      <select
                        className="text-xs px-2 py-1 rounded border border-border focus:outline-none"
                        value={claim.status}
                        onChange={(e) => handleStatusChange(claim, e.target.value)}
                      >
                        {['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'DENIED', 'APPEALING', 'PAID', 'VOID'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => setReimbursementClaim(claim)}
                          title="Record reimbursement"
                          className="p-1.5 rounded hover:bg-green-50 text-green-600"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        {claim.status === 'DRAFT' && (
                          <button
                            onClick={() => { if (confirm('Delete this claim?')) deleteClaim.mutate(claim.id); }}
                            className="p-1.5 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showNewModal && (
        <NewClaimModal
          businessId={businessId}
          providers={providers}
          clients={clients}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {reimbursementClaim && (
        <ReimbursementModal
          businessId={businessId}
          claim={reimbursementClaim}
          onClose={() => setReimbursementClaim(null)}
        />
      )}
    </div>
  );
}

// ---- Reimbursements Tab ----
function ReimbursementsTab({ businessId }: { businessId: string }) {
  const { data, isLoading } = useClaimReimbursements(businessId);
  const reimbursements = data?.reimbursements ?? [];

  const totalPaid = reimbursements.reduce((s: number, r: any) => s + (r.amountPaid ?? 0), 0);
  const totalBilled = reimbursements.reduce((s: number, r: any) => s + (r.amountBilled ?? 0), 0);
  const totalPatientResp = reimbursements.reduce((s: number, r: any) => s + (r.patientResponsibility ?? 0), 0);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading reimbursements...</div>;

  return (
    <div>
      {reimbursements.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Billed</p>
              <p className="text-lg font-bold">${totalBilled.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Received</p>
              <p className="text-lg font-bold text-emerald-600">${totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Patient Responsibility</p>
              <p className="text-lg font-bold text-orange-600">${totalPatientResp.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {reimbursements.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No reimbursements recorded yet.</p>
          <p className="text-xs mt-1">Record payments from the Claims tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reimbursements.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm">{r.claim?.claimNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'RECONCILED' ? 'bg-[#EDE5F4] text-[#5D4AA8]' :
                        r.status === 'RECEIVED' ? 'bg-[#EDE5F4] text-[#5D4AA8]' :
                        'bg-[#EFE9F2] text-[#7A7090]'
                      }`}>{r.status}</span>
                    </div>
                    <p className="text-sm font-medium">
                      {r.claim?.client?.firstName} {r.claim?.client?.lastName}
                      <span className="text-muted-foreground font-normal"> — {r.claim?.insuranceProvider?.name}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {r.checkNumber && <span>Check: {r.checkNumber}</span>}
                      {r.eobNumber && <span>EOB: {r.eobNumber}</span>}
                      {r.paymentDate && <span>Paid: {new Date(r.paymentDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">+${r.amountPaid?.toFixed(2)}</p>
                    {r.patientResponsibility > 0 && (
                      <p className="text-xs text-orange-600">Pt: ${r.patientResponsibility?.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function InsuranceClaimsPage() {
  const businessId = useBusinessId();
  const [activeTab, setActiveTab] = useState<'providers' | 'claims' | 'reimbursements'>('claims');

  const { data: providersData } = useInsuranceProviders(businessId);
  const { data: clientsRaw } = useClients(businessId);
  const { data: claimsData } = useInsuranceClaims(businessId);

  const providers = providersData?.providers ?? [];
  const clients = (Array.isArray(clientsRaw) ? clientsRaw : []) as any[];
  const claims = claimsData?.claims ?? [];

  const claimsByStatus = claims.reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tabs = [
    { id: 'claims', label: 'Claims', count: claims.length },
    { id: 'reimbursements', label: 'Reimbursements' },
    { id: 'providers', label: 'Providers', count: providers.length },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Insurance Claims</h1>
            <p className="text-sm text-muted-foreground">CMS-1500 billing and reimbursement tracking</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {claims.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(claimsByStatus).map(([status, count]) => (
            <div key={status} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${CLAIM_STATUS_STYLES[status]}`}>
              {CLAIM_STATUS_ICONS[status]}
              {count} {status}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'providers' && businessId && <ProvidersTab businessId={businessId} />}
      {activeTab === 'claims' && businessId && (
        <ClaimsTab businessId={businessId} providers={providers} clients={clients} />
      )}
      {activeTab === 'reimbursements' && businessId && <ReimbursementsTab businessId={businessId} />}
    </div>
  );
}
