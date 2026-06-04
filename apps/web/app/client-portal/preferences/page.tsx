'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PortalShell } from '../components/PortalShell';
import { Settings, Loader2, Check, Gift } from 'lucide-react';

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PortalPreferences() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [preferredTherapistId, setPreferredTherapistId] = useState<string>('');
  const [goals, setGoals] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState<string>('');
  const [birthdayDay, setBirthdayDay] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const r = await fetch('/api/client-portal/preferences', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await r.json();
      if (data) {
        setTherapists(data.therapists ?? []);
        setPreferredTherapistId(data.preferredTherapistId ?? '');
        setGoals(data.goals ?? '');
        setBirthdayMonth(data.birthdayMonth ? String(data.birthdayMonth) : '');
        setBirthdayDay(data.birthdayDay ? String(data.birthdayDay) : '');
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    await fetch('/api/client-portal/preferences', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferredTherapistId: preferredTherapistId || null,
        goals,
        birthdayMonth: birthdayMonth ? parseInt(birthdayMonth, 10) : null,
        birthdayDay: birthdayDay ? parseInt(birthdayDay, 10) : null,
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const maxDay = birthdayMonth ? new Date(2024, parseInt(birthdayMonth, 10), 0).getDate() : 31;
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <PortalShell>
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1830' }}>Preferences</h1>
          <p className="text-sm mt-1" style={{ color: '#7A7090' }}>Set your booking preferences, goals, and birthday for perks.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3D3450' }}>Preferred therapist</label>
                <select
                  value={preferredTherapistId}
                  onChange={(e) => setPreferredTherapistId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: '#1E1830' }}
                >
                  <option value="">No preference</option>
                  {therapists.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1.5" style={{ color: '#9E96B0' }}>We'll try to book you with your preferred therapist when available.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3D3450' }}>Goals & preferences</label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Focus on lower back, prefer firm pressure, allergy to certain oils..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: '#1E1830' }}
                />
              </div>
            </div>

            {/* Birthday — earns 2x points on birthday month visits */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" style={{ color: '#5D4AA8' }} />
                <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Birthday</p>
              </div>
              <p className="text-xs" style={{ color: '#9E96B0' }}>
                Add your birthday to earn 2x points on visits during your birthday month and unlock the Platinum birthday treatment upgrade.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#3D3450' }}>Month</label>
                  <select
                    value={birthdayMonth}
                    onChange={(e) => { setBirthdayMonth(e.target.value); setBirthdayDay(''); }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: birthdayMonth ? '#1E1830' : '#9E96B0' }}
                  >
                    <option value="">Month</option>
                    {MONTHS.slice(1).map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: 120 }}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#3D3450' }}>Day</label>
                  <select
                    value={birthdayDay}
                    onChange={(e) => setBirthdayDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: birthdayDay ? '#1E1830' : '#9E96B0' }}
                    disabled={!birthdayMonth}
                  >
                    <option value="">Day</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              {birthdayMonth && birthdayDay && (
                <p className="text-xs" style={{ color: '#1B8A5A' }}>
                  Birthday set to {MONTHS[parseInt(birthdayMonth, 10)]} {birthdayDay}. You'll earn 2x points on visits this month!
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
              {saved ? 'Saved!' : 'Save preferences'}
            </button>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
