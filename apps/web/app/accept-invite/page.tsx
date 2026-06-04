'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  THERAPIST: 'Therapist',
  SENIOR_THERAPIST: 'Senior Therapist',
  RECEPTIONIST: 'Receptionist',
  OWNER: 'Owner',
};

function Logo() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
      >
        <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
          <path d="M9 2C9 2 5 5.5 5 9.5C5 11.985 6.791 14 9 14C11.209 14 13 11.985 13 9.5C13 5.5 9 2 9 2Z" fill="white" opacity="0.9" />
          <path d="M9 14V16M6 15.5H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold" style={{ color: '#1E1830', letterSpacing: '-0.3px' }}>
        Iris Care Suite
      </h1>
    </div>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [invite, setInvite] = useState<any>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link.');
      setLoading(false);
      return;
    }

    const load = async () => {
      const [inviteRes, { data: { session } }] = await Promise.all([
        fetch(`/api/staff-invites/validate/${token}`),
        supabase.auth.getSession(),
      ]);

      if (!inviteRes.ok) {
        const json = await inviteRes.json();
        setError(json.error || 'Invite not found or expired.');
        setLoading(false);
        return;
      }

      const json = await inviteRes.json();
      setInvite(json.data);
      setLoggedInUser(session?.user ?? null);
      setLoading(false);
    };

    load();
  }, [token]);

  const handleAccept = async () => {
    if (!invite || !loggedInUser) return;
    setAccepting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your session expired. Please sign in again.');
        setAccepting(false);
        return;
      }

      const res = await fetch(`/api/staff-invites/${invite.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to accept invite.');
        setAccepting(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
      setAccepting(false);
    }
  };

  const returnUrl = `/accept-invite?token=${token}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F7' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#F3F4F7' }}>
        <div className="w-full max-w-sm text-center">
          <Logo />
          <div className="rounded-[22px] p-8" style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}>
            <CheckCircle className="h-10 w-10 mx-auto mb-4" style={{ color: '#5D4AA8' }} />
            <h2 className="text-base font-semibold mb-2" style={{ color: '#1E1830' }}>Welcome to {invite?.business?.name}!</h2>
            <p className="text-sm" style={{ color: '#7A7090' }}>Taking you to your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#F3F4F7' }}>
        <div className="w-full max-w-sm text-center">
          <Logo />
          <div className="rounded-[22px] p-8" style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}>
            <XCircle className="h-10 w-10 mx-auto mb-4" style={{ color: '#E53E3E' }} />
            <h2 className="text-base font-semibold mb-2" style={{ color: '#1E1830' }}>Invalid Invite</h2>
            <p className="text-sm" style={{ color: '#7A7090' }}>{error}</p>
            <Link href="/sign-in" className="mt-4 inline-block text-sm font-medium" style={{ color: '#5D4AA8' }}>Go to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#F3F4F7' }}>
      <div className="w-full max-w-sm">
        <Logo />
        <div className="rounded-[22px] p-8" style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: '#1E1830' }}>You've been invited!</h2>
          <p className="text-sm mb-6" style={{ color: '#7A7090' }}>
            {invite?.inviterName} has invited you to join their practice on Iris.
          </p>

          <div className="rounded-xl p-4 mb-6 space-y-2" style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#7A7090' }}>Practice</span>
              <span className="font-semibold" style={{ color: '#1E1830' }}>{invite?.business?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#7A7090' }}>Your role</span>
              <span className="font-semibold" style={{ color: '#5D4AA8' }}>{ROLE_LABEL[invite?.role] ?? invite?.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#7A7090' }}>Invited email</span>
              <span className="font-medium" style={{ color: '#1E1830' }}>{invite?.email}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}>
              {error}
            </div>
          )}

          {loggedInUser ? (
            <div className="space-y-3">
              {loggedInUser.email?.toLowerCase() === invite?.email?.toLowerCase() ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: '0 4px 16px rgba(93,74,168,0.27)' }}
                >
                  {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {accepting ? 'Accepting…' : 'Accept Invitation'}
                </button>
              ) : (
                <div>
                  <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE68A' }}>
                    You&apos;re signed in as <strong>{loggedInUser.email}</strong>, but this invite was sent to <strong>{invite?.email}</strong>. Please sign in with the correct account.
                  </div>
                  <Link
                    href={`/sign-in?redirectTo=${encodeURIComponent(returnUrl)}`}
                    className="block text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
                  >
                    Sign in with different account
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/sign-in?redirectTo=${encodeURIComponent(returnUrl)}`}
                className="block text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: '0 4px 16px rgba(93,74,168,0.27)' }}
              >
                Sign in to accept
              </Link>
              <Link
                href={`/sign-up?returnUrl=${encodeURIComponent(returnUrl)}`}
                className="block text-center py-2.5 rounded-xl text-sm font-semibold border"
                style={{ color: '#5D4AA8', borderColor: 'rgba(93,74,168,0.3)', background: '#F4F0FB' }}
              >
                Create account &amp; accept
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F7' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
