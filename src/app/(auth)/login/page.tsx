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
    <div className="min-h-screen flex items-center justify-center p-4 proton-auth-bg">
      <div className="w-full max-w-[480px] rounded-[24px] bg-white p-6 sm:p-11 space-y-6 shadow-[0_8px_24px_rgba(109,74,255,0.16)] border border-[#EAE6F5]">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BookGridLogo />
          </div>
          <h1 className="text-[28px] font-normal text-[#0C0C14] leading-tight">Sign in</h1>
          <p className="text-xs text-[#5C5873]">
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
          <div className="flex-grow border-t border-[#EAE6F5]" />
          <span className="shrink mx-3 text-[11px] font-semibold uppercase text-slate-400">or</span>
          <div className="flex-grow border-t border-[#EAE6F5]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1B1340]">Work email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourshop.com"
              className="w-full h-11 rounded-lg bg-white border border-[#ADABA8] hover:border-[#8F8D8A] px-3.5 text-sm text-[#0C0C14] focus:border-[#6D4AFF] focus:ring-[3px] focus:ring-[#6D4AFF]/20 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1B1340]">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 rounded-lg bg-white border border-[#ADABA8] hover:border-[#8F8D8A] px-3.5 text-sm text-[#0C0C14] focus:border-[#6D4AFF] focus:ring-[3px] focus:ring-[#6D4AFF]/20 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#6D4AFF] text-white font-semibold text-sm hover:bg-[#6243E6] active:bg-[#573BCC] transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          New to BookGrid?{' '}
          <Link href="/signup" className="text-[#1B1340] font-semibold hover:underline">
            Start 14-day free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
