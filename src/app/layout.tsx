import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'BookGrid — Scheduling & Waitlist Software for Service Teams',
  description:
    'Multi-service booking cart, up to 5 team members included ($29 USD / 25 € EUR), automatic waitlist gap-filling, and AI schedule import.',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F7FC] text-[#1B1340] antialiased selection:bg-slate-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
