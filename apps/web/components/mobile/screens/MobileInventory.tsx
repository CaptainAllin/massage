'use client';

import React, { useState } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Card, SectionHead, Chip } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useInventory, useCreateProduct, useAdjustInventory } from '@/lib/hooks/use-inventory';
import type { MobileRouter } from '../MobileShell';

interface MobileInventoryProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Oils', 'Lotions', 'Tools', 'Retail', 'Supplies', 'Other'];

const CATEGORY_EMOJI: Record<string, string> = {
  Oils: '🫙', Lotions: '🧴', Tools: '🛠️', Retail: '🛍️', Supplies: '📦', Other: '📋',
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRect({ width = '100%', height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="im-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

// ─── Add-product sheet ───────────────────────────────────────────────────────

interface AddProductSheetProps {
  businessId: string;
  onClose: () => void;
}

function AddProductSheet({ businessId, onClose }: AddProductSheetProps) {
  const [form, setForm] = useState({ name: '', category: 'Oils', currentStock: '0', lowStockThreshold: '5', unitPrice: '' });
  const [saving, setSaving] = useState(false);
  const createProduct = useCreateProduct(businessId);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createProduct.mutateAsync({
        name: form.name,
        category: form.category,
        currentStock: parseInt(form.currentStock) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        unitPrice: parseFloat(form.unitPrice) || 0,
      } as any);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,20,54,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', background: 'var(--m-bg)', borderRadius: '24px 24px 0 0', padding: '20px 16px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Add product</div>
          <button onClick={onClose} style={{ background: 'var(--m-soft)', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--m-ink)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Product name *</div>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Lavender Oil"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--m-line2)', background: 'var(--m-surface)', fontSize: 14.5, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Category</div>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--m-line2)', background: 'var(--m-surface)', fontSize: 14, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', outline: 'none' }}>
              {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Unit price</div>
            <input type="number" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} placeholder="0.00"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--m-line2)', background: 'var(--m-surface)', fontSize: 14, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Stock</div>
            <input type="number" value={form.currentStock} onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))} min="0"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--m-line2)', background: 'var(--m-surface)', fontSize: 14, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Low stock at</div>
            <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} min="0"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--m-line2)', background: 'var(--m-surface)', fontSize: 14, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !form.name.trim()}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--m-grad)', border: 'none', fontSize: 15, fontWeight: 700, color: '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Adding…' : 'Add product'}
        </button>
      </div>
    </div>
  );
}

// ─── Product Row ─────────────────────────────────────────────────────────────

function ProductRow({ product, businessId, last }: { product: any; businessId: string; last: boolean }) {
  const [adjusting, setAdjusting] = useState(false);
  const [delta, setDelta] = useState('');
  const [saving, setSaving] = useState(false);
  const adjust = useAdjustInventory(businessId);

  const isLow = product.currentStock <= product.lowStockThreshold;
  const emoji = CATEGORY_EMOJI[product.category] ?? '📋';

  const handleAdjust = async (dir: 1 | -1) => {
    const amount = Math.abs(parseInt(delta) || 1) * dir;
    setSaving(true);
    try {
      await adjust.mutateAsync({ productId: product.id, adjustment: amount, reason: 'Manual adjustment' } as any);
      setAdjusting(false);
      setDelta('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--m-line2)' }}>
      <button
        className="im-tab im-press"
        onClick={() => setAdjusting((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--m-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            {product.category}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: isLow ? 'var(--m-warn)' : 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            {product.currentStock}
          </span>
          {isLow && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--m-warn)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              Low stock
            </span>
          )}
        </div>
      </button>

      {adjusting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 12px' }}>
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="Qty"
            min="1"
            style={{ width: 70, padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--m-line2)', background: 'var(--m-bg)', fontSize: 14, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', outline: 'none' }}
          />
          <button onClick={() => handleAdjust(1)} disabled={saving}
            style={{ flex: 1, padding: '8px 0', borderRadius: 10, background: 'rgba(62,158,122,0.12)', border: 'none', color: 'var(--m-ok)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            + Add
          </button>
          <button onClick={() => handleAdjust(-1)} disabled={saving}
            style={{ flex: 1, padding: '8px 0', borderRadius: 10, background: 'rgba(222,146,119,0.12)', border: 'none', color: 'var(--m-accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            − Use
          </button>
          <button onClick={() => { setAdjusting(false); setDelta(''); }}
            style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--m-soft)', border: 'none', color: 'var(--m-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MobileInventory({ router: _router }: MobileInventoryProps) {
  const businessId = useBusinessId() ?? '';
  const [category, setCategory] = useState('All');
  const [showAdd, setShowAdd] = useState(false);

  const filters = category === 'All' ? {} : { category };
  const { data, isLoading } = useInventory(businessId, filters as any);

  const products: any[] = data?.products ?? [];
  const lowStockCount: number = data?.lowStockCount ?? 0;

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <LargeHeader eyebrow="Operations" title="Inventory" style={{ padding: '0 16px 16px' }} />

      {/* Hero */}
      <div style={{ padding: '0 16px', marginBottom: 18 }}>
        <Card style={{ padding: '16px', display: 'flex', gap: 0 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', letterSpacing: -0.8 }}>
              {isLoading ? '—' : products.length}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>Total SKUs</div>
          </div>
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 16px' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: lowStockCount > 0 ? 'var(--m-warn)' : 'var(--m-ok)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', letterSpacing: -0.8 }}>
              {isLoading ? '—' : lowStockCount}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>Low stock</div>
          </div>
        </Card>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 16, overflowX: 'auto' }}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        <SectionHead title="Products" style={{ marginBottom: 10 }} />

        {isLoading ? (
          <Card style={{ padding: '0 16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < 4 ? '1px solid var(--m-line2)' : 'none' }}>
                <SkeletonRect width={38} height={38} radius={12} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <SkeletonRect width="55%" height={13} />
                  <SkeletonRect width="30%" height={10} />
                </div>
                <SkeletonRect width={32} height={20} radius={6} />
              </div>
            ))}
          </Card>
        ) : products.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--m-surface)', borderRadius: 22, border: '1px solid var(--m-line2)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 4 }}>No products yet</div>
            <div style={{ fontSize: 13, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Tap + to add your first product</div>
          </div>
        ) : (
          <Card style={{ padding: '0 16px' }}>
            {products.map((p: any, i: number) => (
              <ProductRow key={p.id} product={p} businessId={businessId} last={i === products.length - 1} />
            ))}
          </Card>
        )}
      </div>

      {/* FAB */}
      <button
        className="im-tab im-fab"
        onClick={() => setShowAdd(true)}
        style={{ position: 'fixed', right: 18, bottom: 'calc(74px + env(safe-area-inset-bottom))', width: 54, height: 54, borderRadius: 18, background: 'var(--m-grad)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(63,47,135,0.45)', zIndex: 40 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      {showAdd && <AddProductSheet businessId={businessId} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
