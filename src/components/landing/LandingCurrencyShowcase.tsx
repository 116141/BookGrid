'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  FileSpreadsheet,
  Globe,
  Layers,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { BookGridLogo } from '@/components/brand/BookGridLogo';
import type { SupportedCurrency } from '@/schemas/env.schema';

export function LandingCurrencyShowcase() {
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [demoCombo, setDemoCombo] = useState<boolean>(true);
  const [lang, setLang] = useState<'en' | 'pt'>('en');
  const [openFaq, setOpenFaq] = useState<number>(0);

  const pt = lang === 'pt';

  const planPrice = currency === 'USD' ? '$29' : '25 €';
  const planSuffix = currency === 'USD' ? 'USD / month' : 'EUR / month';
  const demoTotalPrice =
    currency === 'USD' ? (demoCombo ? '$60.00 USD' : '$35.00 USD') : demoCombo ? '43.00 € EUR' : '25.00 € EUR';
  const demoDuration = demoCombo ? '60 min' : '40 min';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FC] text-[#1B1340]">
      {/* PROTON-STYLE SUITE TOP BAR */}
      <div className="bg-[#1B1340] text-white text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-white/90 font-medium">
            <span className="px-2 py-0.5 rounded-full bg-[#6D4AFF] text-[10px] font-bold uppercase tracking-wide text-white">
              GilByte Suite
            </span>
            <span>14-day free trial • Up to 5 team members at one flat rate</span>
          </span>
          <a
            href="https://gilbyte-landing-page.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C4B5FD] hover:text-white font-semibold transition"
          >
            Explore all 3 apps →
          </a>
        </div>
      </div>

      {/* TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-[#EAE6F5] bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <BookGridLogo showByline />

          <div className="flex items-center gap-3">
            {/* USD / EUR SWITCHER */}
            <div className="inline-flex items-center rounded-lg border border-[#EAE6F5] bg-[#F8F7FC] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  currency === 'USD'
                    ? 'bg-white text-[#1B1340] shadow-sm'
                    : 'text-[#5C5873] hover:text-[#1B1340]'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  currency === 'EUR'
                    ? 'bg-white text-[#1B1340] shadow-sm'
                    : 'text-[#5C5873] hover:text-[#1B1340]'
                }`}
              >
                EUR (€)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLang(pt ? 'en' : 'pt')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EAE6F5] bg-white text-xs font-semibold text-[#372580] hover:border-[#6D4AFF]/40 transition"
            >
              <Globe className="w-3.5 h-3.5 text-[#6D4AFF]" />
              <span>{pt ? 'PT' : 'EN'}</span>
            </button>

            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold text-[#4A4660] hover:text-[#1B1340] transition"
            >
              {pt ? 'Entrar' : 'Sign in'}
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-full bg-[#6D4AFF] text-white font-semibold text-xs hover:bg-[#4A2DC5] transition shadow-sm"
            >
              {pt ? 'Testar 14 dias grátis' : 'Start free trial'}
            </Link>
          </div>
        </div>
      </header>

      {/* ASYMMETRIC EDITORIAL HERO */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LEFT: CLEAR VALUE PROPOSITION */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2DBFF] border border-[#DDD3FF] text-[#5B38E8] text-xs font-semibold">
                {pt
                  ? 'Infraestrutura de agendamento para equipas de serviços'
                  : 'Scheduling infrastructure for service businesses'}
              </div>

              <h1 className="font-proton-serif text-4xl sm:text-5xl md:text-[54px] text-[#372580] leading-[1.08]">
                {pt
                  ? 'Agendamento simples para equipas — sem taxa por profissional.'
                  : 'Simple, reliable booking for teams—without per-seat pricing.'}
              </h1>

              <p className="text-base text-[#4A4660] leading-relaxed max-w-xl">
                {pt ? 'Dê aos seus clientes um link limpo em ' : 'Give your clients a clean booking link at '}
                <span className="font-mono text-sm text-[#1B1340] bg-[#EFEAFF] px-1.5 py-0.5 rounded border border-[#DDD3FF]">
                  bookgrid.app/[slug]
                </span>
                {pt
                  ? '. Aceite marcações multi-serviços, inclua até 5 profissionais no mesmo preço fixo e recupere cancelamentos automaticamente.'
                  : '. Support multi-service appointments, include up to 5 staff members at one flat rate, and recover last-minute cancellations automatically.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#6D4AFF] text-white font-semibold text-base hover:bg-[#4A2DC5] transition shadow-sm"
                >
                  {pt ? 'Criar página de marcação' : 'Create your booking page'}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-full bg-transparent text-[#6D4AFF] font-semibold text-base shadow-[inset_0_0_0_2px_#6D4AFF] hover:bg-[#4A2DC5] hover:text-white transition"
                >
                  {pt ? 'Entrar no painel' : 'Merchant sign in'}
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6D4AFF]" strokeWidth={2.25} />
                  14-day free trial
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6D4AFF]" strokeWidth={2.25} />
                  Up to 5 team members included
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6D4AFF]" strokeWidth={2.25} />
                  {planPrice} {planSuffix}
                </span>
              </div>
            </div>

            {/* RIGHT: REALISTIC INTERACTIVE PRODUCT PREVIEW CARD */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-[#EAE6F5] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#1B1340]">Atlantic Barber Studio</p>
                    <p className="text-[11px] font-mono text-slate-500">bookgrid.app/atlantic-barber</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EFEAFF] text-[#5B38E8] border border-[#DDD3FF]">
                    Live preview
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      1. Select services (auto-calculates time)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg border-2 border-[#1B1340] bg-slate-50">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#1B1340]">
                          <span>Skin Fade Haircut</span>
                          <span>{currency === 'USD' ? '$35' : '25 €'}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">40 min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDemoCombo((prev) => !prev)}
                        className={`p-3 rounded-lg border text-left transition ${
                          demoCombo
                            ? 'border-2 border-[#1B1340] bg-slate-50'
                            : 'border-[#EAE6F5] bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-[#1B1340]">
                          <span>Hot Towel Beard</span>
                          <span>{currency === 'USD' ? '$25' : '18 €'}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          +20 min {demoCombo ? '(Selected)' : '(Click to add)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      2. Available continuous slots ({demoDuration})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {['09:30', '11:00', '14:30', '16:00'].map((slot, idx) => (
                        <div
                          key={slot}
                          className={`py-2 rounded-lg text-center text-xs font-semibold border ${
                            idx === 1
                              ? 'bg-[#1B1340] text-white border-[#1B1340]'
                              : 'bg-white text-slate-700 border-[#EAE6F5]'
                          }`}
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Total: <b className="text-[#1B1340]">{demoDuration}</b> •{' '}
                      <b className="text-[#1B1340]">{demoTotalPrice}</b>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#5B38E8]">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                      No account needed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES GRID (CLEAN EDITORIAL CARDS) */}
        <section className="border-t border-[#EAE6F5] bg-white py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-bold text-[#1B1340]">
                Built around the real bottlenecks of service businesses
              </h2>
              <p className="text-sm text-slate-600">
                Everything you need to run a multi-staff calendar without enterprise bloat or hidden fees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-xl border border-[#EAE6F5] bg-[#F8F7FC] space-y-2.5">
                <Layers className="w-5 h-5 text-[#1B1340]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#1B1340]">Multi-Service Cart</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clients book combined services in one visit. BookGrid sums durations and reserves a
                  continuous slot automatically.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#EAE6F5] bg-[#F8F7FC] space-y-2.5">
                <Users className="w-5 h-5 text-[#1B1340]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#1B1340]">Up to 5 Staff Included</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Add up to 5 active team members with independent schedules for one flat monthly price.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#EAE6F5] bg-[#F8F7FC] space-y-2.5">
                <CalendarCheck className="w-5 h-5 text-[#1B1340]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#1B1340]">Smart Waitlist Fill</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When a client cancels, BookGrid matches waiting clients whose services fit that exact
                  gap so you fill the slot in one click.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#EAE6F5] bg-[#F8F7FC] space-y-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#1B1340]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#1B1340]">AI Schedule Import</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Paste messy WhatsApp messages or paper notebook notes to import existing bookings in
                  seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING (USD & EUR ONLY) */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <div className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="space-y-3 max-w-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B38E8]">
                  Flat-Rate Pricing ({currency})
                </span>
                <h2 className="text-2xl font-bold text-[#1B1340]">
                  BookGrid Pro — All Features Included
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#6D4AFF] shrink-0" strokeWidth={2} />
                    Dedicated booking link: <code className="text-[#1B1340]">bookgrid.app/your-shop</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#6D4AFF] shrink-0" strokeWidth={2} />
                    Up to <b>5 team members</b> included ($0 extra per seat)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#6D4AFF] shrink-0" strokeWidth={2} />
                    Multi-service cart, smart waitlist &amp; AI schedule importer
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-[#F8F7FC] border border-[#EAE6F5] p-6 text-center min-w-[230px] space-y-4">
                <div>
                  <div className="text-4xl font-bold text-[#1B1340]">{planPrice}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">{planSuffix}</div>
                </div>
                <Link
                  href="/signup"
                  className="block w-full py-2.5 px-4 rounded-lg bg-[#6D4AFF] text-white font-semibold text-xs hover:bg-[#5B38E8] transition"
                >
                  Start 14-day free trial
                </Link>
                <p className="inline-flex items-center justify-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  Global billing via Paddle / Dodo
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* PROTON-STYLE 2-COLUMN FAQ */}
        <section className="bg-white border-t border-[#EAE6F5] py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <h2 className="font-proton-serif text-3xl sm:text-4xl text-[#372580]">
              {pt ? 'Perguntas frequentes' : 'Frequently asked questions'}
            </h2>
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-2">
              {[
                {
                  q: pt ? 'Os meus clientes precisam de criar conta?' : 'Do clients need to create an account?',
                  a: pt
                    ? 'Não. O seu cliente abre bookgrid.app/[slug], escolhe serviços e confirma em 30 segundos sem login.'
                    : 'No. Clients open bookgrid.app/[slug], pick services, and book in 30 seconds with zero login.',
                },
                {
                  q: pt ? 'Quantos profissionais estão incluídos?' : 'How many staff members are included?',
                  a: pt
                    ? 'Até 5 profissionais incluídos no mesmo preço fixo ($29 USD / €25 EUR/mês), sem taxa extra por cadeira.'
                    : 'Up to 5 team members are included in the flat rate ($29 USD / €25 EUR/month) with zero per-seat fees.',
                },
                {
                  q: pt ? 'Preciso de cartão para testar 14 dias?' : 'Do I need a credit card for the 14-day trial?',
                  a: pt
                    ? 'Não. Pode criar a sua página, importar a agenda com IA e testar tudo grátis por 14 dias.'
                    : 'No. Create your booking page, import your schedule with AI, and test free for 14 days.',
                },
                {
                  q: pt ? 'Como funciona a lista de espera automática?' : 'How does the Smart Waitlist work?',
                  a: pt
                    ? 'Quando alguém cancela, o BookGrid encontra clientes compatíveis com a duração livre e envia alerta pelo WhatsApp em 1 clique.'
                    : 'When a booking cancels, BookGrid matches waiting clients that fit that exact time gap with 1-click WhatsApp outreach.',
                },
              ].map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q} className="border-b border-[#EAE6F5] py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left"
                    >
                      <span className="text-sm font-bold text-[#372580]">{item.q}</span>
                      <span
                        className={`w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0 transition ${
                          isOpen ? 'bg-[#6D4AFF] text-white' : 'bg-[#F7F5FF] text-[#6D4AFF]'
                        }`}
                      >
                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </span>
                    </button>
                    {isOpen && <p className="mt-2.5 text-xs sm:text-sm text-[#4A4660] leading-relaxed">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* PROTON-STYLE MULTI-COLUMN FOOTER */}
      <footer className="border-t border-[#EAE6F5] bg-[#F7F5FF] pt-14 pb-8 px-4 text-xs text-[#5C5873]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2.5">
              <div className="font-bold text-[#372580]">BookGrid</div>
              <p>{pt ? 'Agendamento sem comissões' : 'Flat-rate team scheduling'}</p>
              <p>GilByte Solutions</p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-[#372580]">{pt ? 'Suíte GilByte' : 'GilByte Suite'}</div>
              <a href="https://gilbyte-landing-page.vercel.app" target="_blank" rel="noopener noreferrer" className="block hover:text-[#6D4AFF]">
                GilByte Portal
              </a>
              <a href="https://intakedock-liart.vercel.app" target="_blank" rel="noopener noreferrer" className="block hover:text-[#6D4AFF]">
                IntakeDock
              </a>
              <a href="https://smart-biz-chat.vercel.app" target="_blank" rel="noopener noreferrer" className="block hover:text-[#6D4AFF]">
                SmartBizChat
              </a>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-[#372580]">{pt ? 'Produto' : 'Product'}</div>
              <Link href="/pricing" className="block hover:text-[#6D4AFF]">
                {pt ? 'Preços' : 'Pricing'}
              </Link>
              <Link href="/atlantic-barber-studio" className="block hover:text-[#6D4AFF]">
                {pt ? 'Vitrine Demo' : 'Live Demo'}
              </Link>
              <Link href="/terms" className="block hover:text-[#6D4AFF]">
                Terms &amp; Refunds
              </Link>
              <Link href="/privacy" className="block hover:text-[#6D4AFF]">
                Privacy Policy
              </Link>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-[#372580]">{pt ? 'Contacto' : 'Connect'}</div>
              <a href="mailto:gilbytesolutions@hotmail.com" className="block hover:text-[#6D4AFF]">
                gilbytesolutions@hotmail.com
              </a>
              <a href="https://wa.me/2389172385" target="_blank" rel="noopener noreferrer" className="block hover:text-[#6D4AFF]">
                WhatsApp: +238 917 2385
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-[#EAE6F5] flex flex-wrap items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} BookGrid by GilByte Solutions. All rights reserved.</span>
            <button
              type="button"
              onClick={() => setLang(pt ? 'en' : 'pt')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#6D4AFF]/40 text-[#372580] font-semibold hover:bg-white transition"
            >
              <Globe className="w-3.5 h-3.5 text-[#6D4AFF]" />
              {pt ? 'Português' : 'English'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
