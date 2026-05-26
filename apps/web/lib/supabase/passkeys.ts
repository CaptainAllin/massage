'use client';

import { createClient } from './client';

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binStr = atob(padded);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export type PasskeyFactor = {
  id: string;
  friendlyName: string;
  createdAt: string;
  status: string;
};

export async function listPasskeys(): Promise<PasskeyFactor[]> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.all ?? [])
    .filter((f: any) => f.factor_type === 'webauthn')
    .map((f: any) => ({
      id: f.id,
      friendlyName: f.friendly_name || 'Passkey',
      createdAt: f.created_at,
      status: f.status,
    }));
}

export async function enrollPasskey(friendlyName = 'My Passkey'): Promise<string> {
  if (typeof window === 'undefined' || !('credentials' in navigator)) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'webauthn' as any,
    friendlyName,
  });
  if (error) throw error;
  if (!data) throw new Error('No enrollment data received');

  const { id: factorId } = data;
  const creationOptions = (data as any).webauthn?.credentialCreationOptions;
  if (!creationOptions) throw new Error('Supabase WebAuthn not enabled — enable it in your Supabase project settings under Authentication → MFA.');

  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    ...creationOptions,
    challenge: base64urlToBuffer(creationOptions.challenge),
    user: {
      ...creationOptions.user,
      id: base64urlToBuffer(creationOptions.user.id),
    },
    excludeCredentials: (creationOptions.excludeCredentials ?? []).map((c: any) => ({
      ...c,
      id: base64urlToBuffer(c.id),
    })),
  };

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
  } catch (err: any) {
    if (err.name === 'NotAllowedError') throw new Error('Passkey creation was cancelled or timed out.');
    throw err;
  }
  if (!credential) throw new Error('Credential creation returned null.');

  const pk = credential as PublicKeyCredential;
  const resp = pk.response as AuthenticatorAttestationResponse;

  const code = JSON.stringify({
    id: pk.id,
    rawId: bufferToBase64url(pk.rawId),
    type: pk.type,
    response: {
      clientDataJSON: bufferToBase64url(resp.clientDataJSON),
      attestationObject: bufferToBase64url(resp.attestationObject),
    },
  });

  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData!.id,
    code,
  });
  if (verifyError) throw verifyError;

  return factorId;
}

export async function revokePasskey(factorId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

// Used on the sign-in page — tries Supabase's native passkey sign-in (2025+).
// Falls back to a clear error if the method isn't available.
export async function signInWithPasskey(): Promise<void> {
  if (typeof window === 'undefined' || !('credentials' in navigator)) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const supabase = createClient();

  if (typeof (supabase.auth as any).signInWithPasskey !== 'function') {
    throw new Error('Your Supabase project version does not support passkey sign-in yet. Please sign in with your password.');
  }

  const { error } = await (supabase.auth as any).signInWithPasskey({});
  if (error) throw error;
}

// Used post-password sign-in to complete a WebAuthn MFA challenge.
export async function completeMfaWithPasskey(): Promise<void> {
  if (typeof window === 'undefined' || !('credentials' in navigator)) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const supabase = createClient();

  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) throw factorsError;

  const webauthnFactor = (factorsData?.all ?? []).find((f: any) => f.factor_type === 'webauthn' && f.status === 'verified');
  if (!webauthnFactor) throw new Error('No verified passkey found. Please register a passkey first in Settings → Security.');

  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: webauthnFactor.id });
  if (challengeError) throw challengeError;

  const requestOpts: PublicKeyCredentialRequestOptions = {
    challenge: base64urlToBuffer((challengeData as any).webauthn?.credentialRequestOptions?.challenge ?? ''),
    timeout: 60000,
    userVerification: 'preferred',
    allowCredentials: [],
  };

  let assertion: Credential | null;
  try {
    assertion = await navigator.credentials.get({ publicKey: requestOpts });
  } catch (err: any) {
    if (err.name === 'NotAllowedError') throw new Error('Passkey authentication was cancelled or timed out.');
    throw err;
  }
  if (!assertion) throw new Error('No credential returned from the authenticator.');

  const pk = assertion as PublicKeyCredential;
  const resp = pk.response as AuthenticatorAssertionResponse;

  const code = JSON.stringify({
    id: pk.id,
    rawId: bufferToBase64url(pk.rawId),
    type: pk.type,
    response: {
      clientDataJSON: bufferToBase64url(resp.clientDataJSON),
      authenticatorData: bufferToBase64url(resp.authenticatorData),
      signature: bufferToBase64url(resp.signature),
      userHandle: resp.userHandle ? bufferToBase64url(resp.userHandle) : null,
    },
  });

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: webauthnFactor.id,
    challengeId: challengeData!.id,
    code,
  });
  if (verifyError) throw verifyError;
}
