'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all";
const inputStyle = { border: '1px solid #E5DEEC', color: '#1E1830', background: '#fff' };

function IrisInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={inputClass}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#5D4AA8'; props.onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = '#E5DEEC'; props.onBlur?.(e); }}
    />
  );
}

function IrisLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D3450' }}>
      {children}
    </label>
  );
}

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'BUSINESS_OWNER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const session = signUpData.session;
    if (session && formData.role === 'BUSINESS_OWNER') {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const res = await fetch(`${API_URL}/businesses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: `${formData.firstName}'s Practice`,
            email: formData.email,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const businessId = json.data?.id;
          if (businessId) {
            await supabase.auth.updateUser({ data: { businessId } });
          }
        }
      } catch (setupErr) {
        console.warn('[SIGN-UP] Business setup failed:', setupErr);
      }
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
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Create your account</p>
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

          <form className="space-y-4" onSubmit={handleSignUp}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <IrisLabel>First Name</IrisLabel>
                <IrisInput
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jane"
                />
              </div>
              <div>
                <IrisLabel>Last Name</IrisLabel>
                <IrisInput
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div>
              <IrisLabel>Email address</IrisLabel>
              <IrisInput
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <IrisLabel>Role</IrisLabel>
              <select
                className={inputClass}
                style={inputStyle}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="BUSINESS_OWNER">Business Owner</option>
                <option value="THERAPIST">Therapist</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>

            <div>
              <IrisLabel>Password</IrisLabel>
              <IrisInput
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div>
              <IrisLabel>Confirm Password</IrisLabel>
              <IrisInput
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#7A7090' }}>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold" style={{ color: '#5D4AA8' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
