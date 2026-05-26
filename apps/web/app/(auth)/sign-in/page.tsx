'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { signInWithPasskey } from '@/lib/supabase/passkeys';

const isWebAuthnSupported = typeof window !== 'undefined' && 'credentials' in navigator && typeof PublicKeyCredential !== 'undefined';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Success — let AuthProvider's onStateChange trigger navigation
  };

  const handlePasskeySignIn = async () => {
    setPasskeyLoading(true);
    setError('');
    try {
      await signInWithPasskey();
    } catch (e: any) {
      setError(e.message || 'Passkey sign-in failed. Please use your password instead.');
      setPasskeyLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: '#F3F4F7' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2C9 2 5 5.5 5 9.5C5 11.985 6.791 14 9 14C11.209 14 13 11.985 13 9.5C13 5.5 9 2 9 2Z"
                fill="white"
                opacity="0.9"
              />
              <path d="M9 14V16M6 15.5H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: '#1E1830', letterSpacing: '-0.3px' }}>
            Iris Care Suite
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Sign in to continue</p>
        </div>

        {/* Card */}
        <div
          className="rounded-[22px] p-8"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}
        >
          {error && (
            <div
              className="rounded-xl p-3 mb-5 text-sm"
              style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}
            >
              {error}
            </div>
          )}

          {/* Passkey sign-in */}
          {isWebAuthnSupported && (
            <>
              <button
                type="button"
                onClick={handlePasskeySignIn}
                disabled={passkeyLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 mb-4"
                style={{
                  background: '#F4F0FB',
                  color: '#5D4AA8',
                  border: '1px solid rgba(93,74,168,0.2)',
                }}
              >
                {passkeyLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="4" />
                    <path d="M16 20v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                )}
                {passkeyLoading ? 'Authenticating…' : 'Sign in with passkey'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: '#EFE9F2' }} />
                <span className="text-xs" style={{ color: '#B0A8C0' }}>or</span>
                <div className="flex-1 h-px" style={{ background: '#EFE9F2' }} />
              </div>
            </>
          )}

          <form className="space-y-4" onSubmit={handleSignIn}>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D3450' }}>
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
                style={{
                  border: '1px solid #E5DEEC',
                  color: '#1E1830',
                  background: '#fff',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5D4AA8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DEEC')}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D3450' }}>
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
                style={{
                  border: '1px solid #E5DEEC',
                  color: '#1E1830',
                  background: '#fff',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5D4AA8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DEEC')}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
                boxShadow: '0 4px 16px rgba(93,74,168,0.27)',
                marginTop: '8px',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#7A7090' }}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-semibold" style={{ color: '#5D4AA8' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#F3F4F7' }}
      >
        <div className="text-sm" style={{ color: '#7A7090' }}>Loading…</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
