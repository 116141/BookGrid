'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInMerchantAction } from '@/actions/auth.actions';
import { BookGridLogo } from '@/components/brand/BookGridLogo';
import { GoogleOAuthButton } from '@/components/auth/GoogleOAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await signInMerchantAction({ email, password });
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    router.push('/agenda');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BookGridLogo />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">Sign in to your account</h1>
          <p className="text-xs text-slate-500">
            Manage your agenda, waitlist recovery, and team
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <GoogleOAuthButton label="Continue with Google" />

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-200" />
          <span className="shrink mx-3 text-[11px] font-semibold uppercase text-slate-400">or</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Work email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourshop.com"
              className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#0F172A] text-white font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          New to BookGrid?{' '}
          <Link href="/signup" className="text-[#0F172A] font-semibold hover:underline">
            Start 14-day free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
