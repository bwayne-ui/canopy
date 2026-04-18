'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError('Invalid username or password');
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Sign-in failed. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="mb-5">
          <div className="text-[10px] font-bold text-[#00AA6C] uppercase tracking-widest mb-1">Juniper Square</div>
          <h1 className="text-sm font-semibold text-[#1a1a1a]">Canopy Prototype</h1>
          <p className="text-xs text-[#6b7280] mt-1">Sign in to continue.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoFocus
            autoComplete="username"
            required
            className="w-full text-xs rounded-lg border border-[#e5e7eb] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AA6C] focus:border-transparent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full text-xs rounded-lg border border-[#e5e7eb] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AA6C] focus:border-transparent"
          />
          {error && <div className="text-xs text-[#b91c1c]">{error}</div>}
          <button
            type="submit"
            disabled={busy || !username || !password}
            className="w-full text-xs font-semibold text-white bg-[#00AA6C] hover:bg-[#008F5A] disabled:opacity-50 px-3 py-2 rounded-lg transition-colors"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
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
