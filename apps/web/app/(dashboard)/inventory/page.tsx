'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  Edit2,
  Archive,
  History,
} from 'lucide-react';
import { useInventory, useCreateProduct, useUpdateProduct, useDeleteProduct, useAdjustInventory, useProduct } from '@/lib/hooks/use-inventory';
import { useBusinessId } from '@/lib/hooks/use-business-id';

const CATEGORIES = ['Oils', 'Lotions', 'Tools', 'Retail', 'Supplies', 'Other'];

function ProductFormModal({
  businessId,
  product,
  onClose,
}: {
  businessId: string;
  product?: any;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? '',
    unitPrice: product?.unitPrice ?? '',
    currentStock: product?.currentStock ?? 0,
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    unit: product?.unit ?? '',
  });

  const createProduct = useCreateProduct(businessId);
  const updateProduct = useUpdateProduct(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      unitPrice: parseFloat(String(form.unitPrice)),
      currentStock: parseInt(String(form.currentStock)),
      lowStockThreshold: parseInt(String(form.lowStockThreshold)),
    };
    if (product) {
      await updateProduct.mutateAsync({ id: product.id, ...data });
    } else {
      await createProduct.mutateAsync(data);
    }
    onClose();
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input required type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Lavender Massage Oil" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="OIL-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— Select —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($) *</label>
              <input required type="number" min="0" step="0.01" value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input type="text" value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="bottle, jar..." />
            </div>
          </div>
          {!product && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
              <input type="number" min="0" value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
            <input type="number" min="0" value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : product ? 'Update' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustStockModal({
  product,
  businessId,
  onClose,
}: {
  product: any;
  businessId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ quantity: '', type: 'PURCHASE', notes: '' });
  const adjustInventory = useAdjustInventory(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(form.quantity);
    const adjustedQty = ['USAGE', 'RETURN_OUT'].includes(form.type) ? -Math.abs(qty) : Math.abs(qty);
    await adjustInventory.mutateAsync({ id: product.id, quantity: adjustedQty, type: form.type, notes: form.notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Adjust Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-semibold">{product.name}</span>
            {' — '}Current stock: <span className="font-bold text-gray-900">{product.currentStock}</span> {product.unit || 'units'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="PURCHASE">Received (stock in)</option>
                <option value="USAGE">Used in session (stock out)</option>
                <option value="ADJUSTMENT">Manual adjustment</option>
                <option value="RETURN">Return from client</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input required type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Received from supplier" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
              <Button variant="primary" type="submit" disabled={adjustInventory.isPending} className="flex-1">
                {adjustInventory.isPending ? 'Updating...' : 'Update Stock'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StockHistoryModal({ product, onClose }: { product: any; onClose: () => void }) {
  const { data, isLoading } = useProduct(product.id);
  const adjustments: any[] = data?.adjustments ?? [];

  const typeLabel: Record<string, string> = {
    PURCHASE: 'Received',
    USAGE: 'Used in session',
    ADJUSTMENT: 'Manual adjustment',
    RETURN: 'Client return',
    RETURN_OUT: 'Returned out',
  };

  const typeColor: Record<string, string> = {
    PURCHASE: 'text-green-700 bg-green-50',
    USAGE: 'text-orange-700 bg-orange-50',
    ADJUSTMENT: 'text-blue-700 bg-blue-50',
    RETURN: 'text-purple-700 bg-purple-50',
    RETURN_OUT: 'text-red-700 bg-red-50',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Stock History</h2>
            <p className="text-sm text-gray-500 mt-0.5">{product.name} · Current: <span className="font-bold text-gray-900">{product.currentStock}</span> {product.unit || 'units'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {isLoading && <p className="text-center text-gray-400 py-8">Loading...</p>}
          {!isLoading && adjustments.length === 0 && (
            <div className="text-center py-12">
              <History className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No stock adjustments yet</p>
            </div>
          )}
          {adjustments.map((adj: any) => (
            <div key={adj.id} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColor[adj.type] ?? 'text-gray-700 bg-gray-100'}`}>
                  {typeLabel[adj.type] ?? adj.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${adj.quantity > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                  </span>
                  <span className="text-xs text-gray-400">
                    {adj.previousStock} → {adj.newStock}
                  </span>
                </div>
                {adj.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{adj.notes}</p>}
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">
                {new Date(adj.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const businessId = useBusinessId();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [historyProduct, setHistoryProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data, isLoading } = useInventory(businessId, {});
  const products = data?.products ?? [];
  const lowStockCount = data?.lowStockCount ?? 0;

  const deleteProduct = useDeleteProduct(businessId);

  const filtered = products.filter((p: any) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
  const totalValue = products.reduce((s: number, p: any) => s + p.unitPrice * p.currentStock, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track products, supplies, and stock levels</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${totalValue.toFixed(2)}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</p>
              </div>
              <div className={`h-10 w-10 ${lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
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
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">SKU</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Stock</th>
                    <th className="pb-3 font-medium">Value</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((product: any) => {
                    const isLow = product.lowStockThreshold !== null && product.currentStock <= product.lowStockThreshold;
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.unit && <div className="text-xs text-gray-400">per {product.unit}</div>}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-500">{product.sku || '—'}</td>
                        <td className="py-3 pr-4">
                          {product.category ? (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{product.category}</span>
                          ) : '—'}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">${product.unitPrice.toFixed(2)}</td>
                        <td className="py-3 pr-4">
                          <div className={`flex items-center gap-1 font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                            {isLow && <AlertTriangle className="w-3 h-3" />}
                            {product.currentStock}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">${(product.unitPrice * product.currentStock).toFixed(2)}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => setAdjustProduct(product)} title="Adjust Stock">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setHistoryProduct(product)} title="Stock History">
                              <History className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditProduct(product)} title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteProduct.mutate(product.id)} title="Archive">
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isCreateOpen && businessId && (
        <ProductFormModal businessId={businessId} onClose={() => setIsCreateOpen(false)} />
      )}
      {editProduct && businessId && (
        <ProductFormModal businessId={businessId} product={editProduct} onClose={() => setEditProduct(null)} />
      )}
      {adjustProduct && businessId && (
        <AdjustStockModal product={adjustProduct} businessId={businessId} onClose={() => setAdjustProduct(null)} />
      )}
      {historyProduct && (
        <StockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}
    </div>
  );
}
