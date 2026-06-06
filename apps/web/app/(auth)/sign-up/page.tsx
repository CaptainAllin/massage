'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

type Step = 'account' | 'account-type' | 'create-business' | 'waiting' | 'done';

function SignUpContent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [step, setStep] = useState<Step>('account');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);

  const supabase = createClient();

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'CLIENT',
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSession(signUpData.session);
    setLoading(false);

    // If there's a returnUrl (e.g. from an invite link), skip account-type and go there
    if (returnUrl) {
      window.location.href = returnUrl;
      return;
    }

    setStep('account-type');
  };

  const handleAccountType = async (type: 'owner' | 'staff' | 'client') => {
    if (type === 'client') {
      window.location.href = '/client-portal';
      return;
    }
    if (type === 'staff') {
      setStep('waiting');
      return;
    }
    // Business owner — show business creation step
    setStep('create-business');
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API_URL}/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.businessName || `${formData.firstName}'s Practice`,
          email: formData.email,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const businessId = json.data?.id;
        if (businessId) {
          await supabase.auth.updateUser({ data: { businessId, role: 'BUSINESS_OWNER' } });
        }
      }
    } catch (err) {
      console.warn('[SIGN-UP] Business setup failed:', err);
    }

    setLoading(false);
    window.location.href = '/dashboard';
  };

  const Logo = () => (
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
    </div>
  );

  if (step === 'account-type') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#F3F4F7' }}>
        <div className="w-full max-w-sm">
          <Logo />
          <div
            className="rounded-[22px] p-8"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}
          >
            <h2 className="text-base font-semibold mb-1" style={{ color: '#1E1830' }}>How will you use Iris?</h2>
            <p className="text-sm mb-6" style={{ color: '#7A7090' }}>Choose what best describes you.</p>

            <div className="space-y-3">
              <button
                onClick={() => handleAccountType('owner')}
                className="w-full text-left rounded-xl p-4 border-2 transition-all hover:border-[#5D4AA8]"
                style={{ borderColor: '#E5DEEC' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>I run a practice</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Set up your business, manage staff and bookings.</p>
              </button>

              <button
                onClick={() => handleAccountType('staff')}
                className="w-full text-left rounded-xl p-4 border-2 transition-all hover:border-[#5D4AA8]"
                style={{ borderColor: '#E5DEEC' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>I&apos;m a staff member</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Your business owner will send you an invite link.</p>
              </button>

              <button
                onClick={() => handleAccountType('client')}
                className="w-full text-left rounded-xl p-4 border-2 transition-all hover:border-[#5D4AA8]"
                style={{ borderColor: '#E5DEEC' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>I&apos;m a client</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Book appointments and manage your profile.</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create-business') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#F3F4F7' }}>
        <div className="w-full max-w-sm">
          <Logo />
          <div
            className="rounded-[22px] p-8"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}
          >
            {error && (
              <div className="rounded-xl p-3 mb-5 text-sm" style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}>
                {error}
              </div>
            )}
            <h2 className="text-base font-semibold mb-1" style={{ color: '#1E1830' }}>Set up your practice</h2>
            <p className="text-sm mb-6" style={{ color: '#7A7090' }}>You can always change this later in settings.</p>

            <form className="space-y-4" onSubmit={handleCreateBusiness}>
              <div>
                <IrisLabel>Practice name</IrisLabel>
                <IrisInput
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder={`${formData.firstName}'s Practice`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(28,20,54,0.12), 0 1px 1px rgba(28,20,54,0.06)', marginTop: '8px' }}
              >
                {loading ? 'Setting up…' : 'Create practice & go to dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#F3F4F7' }}>
        <div className="w-full max-w-sm">
          <Logo />
          <div
            className="rounded-[22px] p-8 text-center"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F3EFFD' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5D4AA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#1E1830' }}>Waiting for your invite</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#7A7090' }}>
              Your account is ready. Ask your practice owner to send you an invite link — once accepted, you&apos;ll land right in your dashboard.
            </p>
            <Link
              href="/sign-in"
              className="text-sm font-medium"
              style={{ color: '#5D4AA8' }}
            >
              Sign in when you have an invite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step: account (default)
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: '#F3F4F7' }}
    >
      <div className="w-full max-w-sm">
        <Logo />
        <p className="text-center text-sm mb-6" style={{ color: '#7A7090' }}>Create your account</p>

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

          <form className="space-y-4" onSubmit={handleAccountSubmit}>
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
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(28,20,54,0.12), 0 1px 1px rgba(28,20,54,0.06)',
                marginTop: '8px',
              }}
            >
              {loading ? 'Creating account…' : 'Continue'}
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

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F7' }}>
        <div className="text-sm" style={{ color: '#7A7090' }}>Loading…</div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
