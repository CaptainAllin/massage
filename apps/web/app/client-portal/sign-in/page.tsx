'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { deriveBrandTokens, brandTokensToCssVars } from '@/lib/brandTokens';
import type { BrandTokens } from '@/lib/brandTokens';

function ClientPortalSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') ?? '';
  const businessId = searchParams.get('businessId');
  const supabase = createClient();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tokens, setTokens] = useState<BrandTokens>(deriveBrandTokens(null, null));

  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/public/booking/${businessId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.data?.business?.primaryColor) {
          setTokens(deriveBrandTokens(d.data.business.primaryColor, d.data.business.secondaryColor ?? null));
        }
      })
      .catch(() => {});
  }, [businessId]);

  const brandVars = brandTokensToCssVars(tokens);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Verify they have a client record
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Sign-in failed'); setLoading(false); return; }

    const check = await fetch('/api/client-portal/auth', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!check.ok) {
      await supabase.auth.signOut();
      const err = await check.json();
      setError(err.error || 'No client account found for this email address.');
      setLoading(false);
      return;
    }

    router.push('/client-portal/appointments');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName, role: 'CLIENT' } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Instant sign-up (no email confirmation required) — go straight in
      router.push('/client-portal/appointments');
      return;
    }

    setSuccessMsg('Check your email to confirm your account, then sign in.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ ...brandVars, background: 'var(--brand-secondary)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))' }}
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M9 2C9 2 5 5.5 5 9.5C5 11.985 6.791 14 9 14C11.209 14 13 11.985 13 9.5C13 5.5 9 2 9 2Z" fill="white" opacity="0.9" />
              <path d="M9 14V16M6 15.5H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: '#1E1830', letterSpacing: '-0.3px' }}>Client Portal</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            {mode === 'sign-in' ? 'Sign in to access your records' : 'Create your portal account'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[22px] p-8"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}
        >
          {error && (
            <div className="rounded-xl p-3 mb-5 text-sm" style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl p-3 mb-5 text-sm" style={{ background: '#E5F5EC', color: '#1a6b38', border: '1px solid #b8e0ca' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={mode === 'sign-in' ? handleSignIn : handleSignUp} className="space-y-4">
            {mode === 'sign-up' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>First name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: '#1E1830' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Last name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: '#1E1830' }}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: '#1E1830' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid #D9D3E8', background: '#FDFCFF', color: '#1E1830' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  style={{ color: '#9E96B0' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))', color: 'var(--brand-on-primary)' }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setSuccessMsg(''); }}
              className="text-sm"
              style={{ color: 'var(--brand-primary)' }}
            >
              {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#9E96B0' }}>
          Your records are encrypted and only accessible to you and your care team.
        </p>
      </div>
    </div>
  );
}

export default function ClientPortalSignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-secondary)' }}><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--brand-primary)' }} /></div>}>
      <ClientPortalSignInContent />
    </Suspense>
  );
}
