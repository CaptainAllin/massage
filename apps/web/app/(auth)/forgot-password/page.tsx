'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
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
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Reset your password</p>
        </div>

        {/* Card */}
        <div
          className="rounded-[22px] p-8"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}
        >
          {sent ? (
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#F0FBF0' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#1E1830' }}>Check your email</p>
              <p className="text-sm" style={{ color: '#7A7090' }}>
                We sent a password reset link to <span className="font-medium" style={{ color: '#3D3450' }}>{email}</span>. Follow the link to set a new password.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="rounded-xl p-3 mb-5 text-sm"
                  style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}
                >
                  {error}
                </div>
              )}

              <p className="text-sm mb-5" style={{ color: '#7A7090' }}>
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <form className="space-y-4" onSubmit={handleSubmit}>
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
                    style={{ border: '1px solid #E5DEEC', color: '#1E1830', background: '#fff' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#5D4AA8')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DEEC')}
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(28,20,54,0.12)',
                    marginTop: '8px',
                  }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#7A7090' }}>
          <Link href="/sign-in" className="font-semibold" style={{ color: '#5D4AA8' }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
