'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Star, Trophy, Copy, Check, Gift, Zap } from 'lucide-react';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  BRONZE: { label: 'Bronze', color: '#92400E', bg: '#FEF3C7', icon: '🥉' },
  SILVER: { label: 'Silver', color: '#4B5563', bg: '#F3F4F6', icon: '🥈' },
  GOLD: { label: 'Gold', color: '#92400E', bg: '#FEF9C3', icon: '🥇' },
  PLATINUM: { label: 'Platinum', color: '#1E40AF', bg: '#EFF6FF', icon: '💎' },
};

const EARN_GUIDE = [
  { icon: '💳', label: '$1 spent', desc: '1 point (or as configured by your provider)' },
  { icon: '🎉', label: 'Sign up', desc: '100 bonus points' },
  { icon: '📅', label: 'First booking', desc: '50 bonus points' },
  { icon: '📋', label: 'Complete intake form', desc: '25 bonus points' },
  { icon: '👥', label: 'Refer a friend', desc: '200 points when they book' },
  { icon: '🎂', label: 'Birthday month', desc: '2× points on your visit' },
  { icon: '⭐', label: 'Leave a review', desc: '50 bonus points' },
];

interface LoyaltyData {
  points: number;
  lifetimePoints: number;
  tier: string;
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    description: string | null;
    createdAt: string;
  }>;
  settings: {
    pointsPerDollar: number;
    dollarPerPoint: number;
    silverMinPoints: number;
    goldMinPoints: number;
    platinumMinPoints: number;
  } | null;
  referralCode: string | null;
  nextTier: string | null;
  pointsToNextTier: number | null;
}

export default function ClientLoyaltyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/client-portal/sign-in'); return; }

      const res = await fetch('/api/client-portal/loyalty', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
      setLoading(false);
    })();
  }, []);

  const handleCopyReferral = () => {
    if (!data?.referralCode) return;
    const text = `Join me and book your first appointment — use my referral code: ${data.referralCode}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
      </div>
    );
  }

  const tier = data?.tier ?? 'BRONZE';
  const tierInfo = TIER_CONFIG[tier] ?? TIER_CONFIG.BRONZE;
  const progressPct = data?.nextTier && data.pointsToNextTier !== null && data.settings
    ? Math.min(100, Math.round(
        ((data.lifetimePoints - getThreshold(data.tier, data.settings)) /
          (data.lifetimePoints + data.pointsToNextTier - getThreshold(data.tier, data.settings))) * 100
      ))
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1E1830' }}>Loyalty Rewards</h1>
        <p className="text-sm mt-1" style={{ color: '#7A7090' }}>Earn points on every visit and unlock exclusive perks</p>
      </div>

      {/* Points + Tier Hero */}
      <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm opacity-75">Your Points Balance</p>
            <p className="text-5xl font-bold mt-1">{(data?.points ?? 0).toLocaleString()}</p>
            <p className="text-sm opacity-75 mt-1">{(data?.lifetimePoints ?? 0).toLocaleString()} lifetime points</p>
          </div>
          <div className="text-right">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ background: tierInfo.bg, color: tierInfo.color }}
            >
              <span>{tierInfo.icon}</span>
              <span>{tierInfo.label}</span>
            </div>
            {data?.settings && (
              <p className="text-xs opacity-75 mt-2">
                {data.settings.pointsPerDollar} pts / $1 spent
              </p>
            )}
          </div>
        </div>

        {/* Progress to next tier */}
        {data?.nextTier && data.pointsToNextTier !== null && (
          <div>
            <div className="flex justify-between text-xs opacity-75 mb-1.5">
              <span>{tierInfo.label}</span>
              <span>{TIER_CONFIG[data.nextTier]?.label}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.9)' }}
              />
            </div>
            <p className="text-xs opacity-75 mt-1.5">
              {data.pointsToNextTier.toLocaleString()} more points to {TIER_CONFIG[data.nextTier]?.label}
            </p>
          </div>
        )}

        {data?.nextTier === null && (
          <p className="text-sm opacity-90 font-semibold">You&apos;ve reached Platinum — the highest tier!</p>
        )}
      </div>

      {/* Points value */}
      {data?.settings && (data?.points ?? 0) > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#EDE5F4', border: '1px solid #D4C5EF' }}>
          <Gift className="h-5 w-5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>
              Your {(data.points).toLocaleString()} points are worth{' '}
              <span style={{ color: '#5D4AA8' }}>
                ${(data.points * data.settings.dollarPerPoint).toFixed(2)}
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
              Redeem at the front desk (min 100 points)
            </p>
          </div>
        </div>
      )}

      {/* Referral link */}
      {data?.referralCode && (
        <div className="rounded-xl p-4" style={{ background: '#F8F5FF', border: '1px solid #E2D5F8' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4" style={{ color: '#5D4AA8' }} />
            <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>Refer a Friend — Earn 200 Points</p>
          </div>
          <p className="text-xs mb-3" style={{ color: '#7A7090' }}>
            Share your code. When a friend books their first appointment, you both earn bonus points.
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-3 py-2 rounded-lg text-sm font-mono font-bold text-center"
              style={{ background: '#5D4AA8', color: '#fff', letterSpacing: '0.1em' }}
            >
              {data.referralCode}
            </div>
            <button
              onClick={handleCopyReferral}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: copied ? '#22C55E' : '#1E1830', color: '#fff' }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Tier perks */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EFE9F2' }}>
        <div className="px-4 py-3" style={{ background: '#F8F5FF' }}>
          <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>Tier Perks</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#EFE9F2' }}>
          {([
            { key: 'BRONZE', pts: '0 pts', perks: 'Portal access, booking history, online rescheduling' },
            { key: 'SILVER', pts: '500 pts', perks: '+5% bonus points on every visit, early promo access' },
            { key: 'GOLD', pts: '1,500 pts', perks: '+10% bonus points, priority booking (1 week early)' },
            { key: 'PLATINUM', pts: '5,000 pts', perks: '+15% bonus points, priority booking, free birthday upgrade' },
          ] as const).map(({ key, pts, perks }) => {
            const t = TIER_CONFIG[key];
            const isCurrentOrAbove = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].indexOf(key) <= ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].indexOf(tier);
            return (
              <div key={key} className="px-4 py-3 flex items-start gap-3">
                <span className="text-lg">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: isCurrentOrAbove ? '#1E1830' : '#7A7090' }}>
                      {t.label}
                    </span>
                    <span className="text-xs" style={{ color: '#7A7090' }}>{pts}</span>
                    {key === tier && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: isCurrentOrAbove ? '#4A4060' : '#9A90A8' }}>{perks}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to earn */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EFE9F2' }}>
        <div className="px-4 py-3" style={{ background: '#F8F5FF' }}>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" style={{ color: '#5D4AA8' }} />
            <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>Ways to Earn Points</p>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: '#EFE9F2' }}>
          {EARN_GUIDE.map(({ icon, label, desc }) => (
            <div key={label} className="px-4 py-3 flex items-center gap-3">
              <span className="text-lg w-7 text-center flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#1E1830' }}>{label}</p>
                <p className="text-xs" style={{ color: '#7A7090' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: '#1E1830' }}>Points History</h2>
        {!data?.transactions.length ? (
          <div className="text-center py-12 rounded-xl" style={{ border: '1px solid #EFE9F2' }}>
            <Trophy className="h-8 w-8 mx-auto mb-2" style={{ color: '#C4B5D4' }} />
            <p className="text-sm" style={{ color: '#7A7090' }}>No transactions yet. Earn points on your first visit!</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EFE9F2' }}>
            <div className="divide-y" style={{ borderColor: '#EFE9F2' }}>
              {data.transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1E1830' }}>
                      {tx.description ?? (tx.type === 'EARN' ? 'Points earned' : tx.type === 'REDEEM' ? 'Points redeemed' : 'Adjustment')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: tx.points >= 0 ? '#16A34A' : '#DC2626' }}
                  >
                    {tx.points >= 0 ? '+' : ''}{tx.points.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getThreshold(tier: string, settings: { silverMinPoints: number; goldMinPoints: number; platinumMinPoints: number }): number {
  switch (tier) {
    case 'SILVER': return settings.silverMinPoints;
    case 'GOLD': return settings.goldMinPoints;
    case 'PLATINUM': return settings.platinumMinPoints;
    default: return 0;
  }
}
