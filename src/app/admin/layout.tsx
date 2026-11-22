import type { ReactNode } from 'react';
import { requireSuperAdminOrNotFound } from '@/lib/auth/super-admin';
import { AdminNav } from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';

export default async function SuperAdminLayout({ children }: { readonly children: ReactNode }) {
  const admin = await requireSuperAdminOrNotFound();

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#1B1340] pb-12">
      <AdminNav adminEmail={admin.email} />
      <main className="max-w-6xl mx-auto px-4 pt-6">{children}</main>
    </div>
  );
}
