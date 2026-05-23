'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { Star, Settings, Trophy, Users } from 'lucide-react';
import {
  useLoyaltyAccounts,
  useLoyaltySettings,
  useUpdateLoyaltySettings,
  useAwardLoyaltyPoints,
  useRedeemLoyaltyPoints,
} from '@/lib/hooks/use-loyalty';
import { useBusinessId } from '@/lib/hooks/use-business-id';

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'bg-amber-100 text-amber-800',
  SILVER: 'bg-gray-100 text-gray-700',
  GOLD: 'bg-yellow-100 text-yellow-800',
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  BRONZE: <Trophy className="w-4 h-4 text-amber-600" />,
  SILVER: <Trophy className="w-4 h-4 text-gray-500" />,
  GOLD: <Trophy className="w-4 h-4 text-yellow-600" />,
};

function SettingsPanel({ businessId, settings, onClose }: { businessId: string; settings: any; onClose: () => void }) {
  const [form, setForm] = useState({
    pointsPerDollar: settings?.pointsPerDollar ?? 1,
    dollarPerPoint: settings?.dollarPerPoint ?? 0.01,
    bronzeMinPoints: settings?.bronzeMinPoints ?? 0,
    silverMinPoints: settings?.silverMinPoints ?? 500,
    goldMinPoints: settings?.goldMinPoints ?? 1500,
    isActive: settings?.isActive ?? true,
    expiryDays: settings?.expiryDays ?? '',
  });
  const updateSettings = useUpdateLoyaltySettings(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync({
      ...form,
      expiryDays: form.expiryDays ? parseInt(String(form.expiryDays)) : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Loyalty Program Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Program Active</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points per $1 spent</label>
              <input type="number" min="0.1" step="0.1" value={form.pointsPerDollar}
                onChange={(e) => setForm({ ...form, pointsPerDollar: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">$ value per point</label>
              <input type="number" min="0.001" step="0.001" value={form.dollarPerPoint}
                onChange={(e) => setForm({ ...form, dollarPerPoint: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Tier Thresholds (lifetime points)</p>
            <div className="space-y-2">
              {[
                { key: 'bronzeMinPoints', label: 'Bronze', color: 'text-amber-600' },
                { key: 'silverMinPoints', label: 'Silver', color: 'text-gray-500' },
                { key: 'goldMinPoints', label: 'Gold', color: 'text-yellow-600' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-sm font-medium w-14 ${color}`}>{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-gray-400">pts</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points Expiry (days, blank = never)</label>
            <input type="number" min="1" value={form.expiryDays}
              onChange={(e) => setForm({ ...form, expiryDays: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 365" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={updateSettings.isPending} className="flex-1">
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustPointsModal({
  account,
  businessId,
  onClose,
}: {
  account: any;
  businessId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ points: '', type: 'EARN', description: '' });
  const awardPoints = useAwardLoyaltyPoints(businessId);
  const redeemPoints = useRedeemLoyaltyPoints(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseInt(form.points);
    if (form.type === 'REDEEM') {
      await redeemPoints.mutateAsync({ clientId: account.clientId, points, description: form.description });
    } else {
      await awardPoints.mutateAsync({
        clientId: account.clientId,
        points: form.type === 'EARN' ? points : -points,
        type: form.type,
        description: form.description,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Adjust Points</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-semibold">{account.client?.firstName} {account.client?.lastName}</span>
            {' — '}<span className="font-bold text-gray-900">{account.points} pts</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="EARN">Earn (add points)</option>
                <option value="REDEEM">Redeem (subtract points)</option>
                <option value="ADJUST">Manual Adjust</option>
                <option value="EXPIRE">Expire Points</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input type="number" min="1" required value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Birthday bonus" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
              <Button variant="primary" type="submit" disabled={awardPoints.isPending || redeemPoints.isPending} className="flex-1">
                Apply
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const businessId = useBusinessId();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<any>(null);

  const { data: accounts = [], isLoading } = useLoyaltyAccounts(businessId);
  const { data: settings } = useLoyaltySettings(businessId);

  const totalMembers = (accounts as any[]).length;
  const goldCount = (accounts as any[]).filter((a: any) => a.tier === 'GOLD').length;
  const silverCount = (accounts as any[]).filter((a: any) => a.tier === 'SILVER').length;
  const totalPoints = (accounts as any[]).reduce((s: number, a: any) => s + a.points, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Loyalty Program</h1>
          <p className="text-muted-foreground mt-1">Manage client points, tiers, and rewards</p>
        </div>
        <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-4 w-4 mr-1.5" /> Program Settings
        </Button>
      </div>

      {settings && !settings.isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Loyalty program is currently <strong>inactive</strong>. Enable it in Program Settings.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: totalMembers, icon: <Users className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-100' },
          { label: 'Total Points Outstanding', value: totalPoints.toLocaleString(), icon: <Star className="h-5 w-5 text-yellow-600" />, bg: 'bg-yellow-100' },
          { label: 'Gold Members', value: goldCount, icon: <Trophy className="h-5 w-5 text-yellow-600" />, bg: 'bg-yellow-100' },
          { label: 'Silver Members', value: silverCount, icon: <Trophy className="h-5 w-5 text-gray-500" />, bg: 'bg-gray-100' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 ${stat.bg} rounded-lg flex items-center justify-center`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {settings && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Rules</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Earn Rate</p>
                <p className="font-bold text-gray-900">{settings.pointsPerDollar} pts / $1</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Redemption</p>
                <p className="font-bold text-gray-900">${settings.dollarPerPoint} / pt</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Silver Threshold</p>
                <p className="font-bold text-gray-900">{settings.silverMinPoints} pts</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Gold Threshold</p>
                <p className="font-bold text-gray-900">{settings.goldMinPoints} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Leaderboard</h2>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (accounts as any[]).length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No loyalty members yet</p>
              <p className="text-gray-400 text-sm mt-1">Points are awarded automatically when payments are processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Tier</th>
                    <th className="pb-3 font-medium">Points</th>
                    <th className="pb-3 font-medium">Lifetime</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(accounts as any[]).map((account: any, idx: number) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900">
                          {account.client?.firstName} {account.client?.lastName}
                        </div>
                        {account.client?.email && (
                          <div className="text-xs text-gray-400">{account.client.email}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[account.tier] || 'bg-gray-100 text-gray-700'}`}>
                          {TIER_ICONS[account.tier]}
                          {account.tier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-bold text-gray-900">{account.points.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-500">{account.lifetimePoints.toLocaleString()}</td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" onClick={() => setAdjustAccount(account)}>
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isSettingsOpen && businessId && (
        <SettingsPanel businessId={businessId} settings={settings} onClose={() => setIsSettingsOpen(false)} />
      )}
      {adjustAccount && businessId && (
        <AdjustPointsModal account={adjustAccount} businessId={businessId} onClose={() => setAdjustAccount(null)} />
      )}
    </div>
  );
}
