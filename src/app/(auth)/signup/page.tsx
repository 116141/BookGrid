'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpMerchantAction } from '@/actions/auth.actions';
import { BookGridLogo } from '@/components/brand/BookGridLogo';
import { GoogleOAuthButton } from '@/components/auth/GoogleOAuthButton';
import type { SupportedCurrency } from '@/schemas/env.schema';

function toUrlSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function SignUpPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [niche, setNiche] = useState<'barber' | 'clinic' | 'auto' | 'realtor' | 'general'>('barber');
  const [city, setCity] = useState('Boston, MA');
  const [whatsappPhone, setWhatsappPhone] = useState('+16175550199');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleBusinessNameChange(val: string) {
    setBusinessName(val);
    setSlug(toUrlSlug(val));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    const res = await signUpMerchantAction({
      email,
      password,
      businessName,
      slug,
      niche,
      city,
      whatsappPhone,
      currency,
    });

    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    if (res.data.requiresEmailConfirmation) {
      setInfoMsg(
        `Account created for bookgrid.app/${res.data.slug}. Please check your email inbox to confirm your account before signing in.`
      );
      return;
    }

    router.push('/agenda');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <BookGridLogo />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">Create your booking page</h1>
          <p className="text-xs text-slate-500">
            14-day free trial • Up to 5 team members included • USD &amp; EUR billing
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {infoMsg}
          </div>
        )}

        <GoogleOAuthButton label="Continue with Google" />

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-200" />
          <span className="shrink mx-3 text-[11px] font-semibold uppercase text-slate-400">or with email</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Business name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder="Atlantic Barber Studio"
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Public URL</label>
              <div className="flex items-center rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 text-xs">
                <span className="text-slate-500 font-mono">bookgrid.app/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(toUrlSlug(e.target.value))}
                  placeholder="atlantic-barber"
                  className="flex-1 bg-transparent text-[#0F172A] font-mono font-semibold focus:outline-none ml-0.5"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Category</label>
              <select
                value={niche}
                onChange={(e) =>
                  setNiche(e.target.value as 'barber' | 'clinic' | 'auto' | 'realtor' | 'general')
                }
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              >
                <option value="barber">Barbershop &amp; Salon</option>
                <option value="clinic">Dental &amp; Clinic</option>
                <option value="auto">Auto Detail</option>
                <option value="realtor">Real Estate</option>
                <option value="general">General Services</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Billing currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-semibold text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              >
                <option value="USD">USD ($29/mo)</option>
                <option value="EUR">EUR (25 €/mo)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Boston, MA"
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">WhatsApp (E.164)</label>
              <input
                type="tel"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+16175550199"
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Owner email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourshop.com"
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Password (min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#0F172A] text-white font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading ? 'Creating your store...' : 'Create BookGrid account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0F172A] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
