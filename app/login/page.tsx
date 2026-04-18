'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError('Could not send code. Try again in a moment.');
        return;
      }
      setStep('code');
      setInfo(`If ${email} is a Juniper Square email, a 6-digit code is on its way.`);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || 'Incorrect code');
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Verification failed');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="mb-5">
          <div className="text-[10px] font-bold text-[#00AA6C] uppercase tracking-widest mb-1">Juniper Square</div>
          <h1 className="text-sm font-semibold text-[#1a1a1a]">Canopy Prototype</h1>
          <p className="text-xs text-[#6b7280] mt-1">
            {step === 'email' ? 'Sign in with your Juniper Square email.' : 'Enter the 6-digit code we emailed you.'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={submitEmail} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@junipersquare.com"
              autoFocus
              required
              className="w-full text-xs rounded-lg border border-[#e5e7eb] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AA6C] focus:border-transparent"
            />
            {error && <div className="text-xs text-[#b91c1c]">{error}</div>}
            <button
              type="submit"
              disabled={busy || !email}
              className="w-full text-xs font-semibold text-white bg-[#00AA6C] hover:bg-[#008F5A] disabled:opacity-50 px-3 py-2 rounded-lg transition-colors"
            >
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="space-y-3">
            {info && <div className="text-xs text-[#00AA6C] bg-[#F0FBF6] rounded-lg px-3 py-2">{info}</div>}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              autoFocus
              required
              className="w-full text-sm font-mono tracking-[0.4em] text-center rounded-lg border border-[#e5e7eb] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AA6C] focus:border-transparent"
            />
            {error && <div className="text-xs text-[#b91c1c]">{error}</div>}
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full text-xs font-semibold text-white bg-[#00AA6C] hover:bg-[#008F5A] disabled:opacity-50 px-3 py-2 rounded-lg transition-colors"
            >
              {busy ? 'Verifying…' : 'Enter'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(''); setInfo(''); }}
              className="w-full text-xs text-[#6b7280] hover:text-[#1a1a1a]"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#6b7280]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
