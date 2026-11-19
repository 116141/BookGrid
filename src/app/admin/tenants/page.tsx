import { requireSuperAdminOrNotFound } from '@/lib/auth/super-admin';
import { getAdminTenantsList } from '@/services/admin/admin-queries.service';
import { AdminTenantsClient } from '@/components/admin/AdminTenantsClient';

export const dynamic = 'force-dynamic';

export default async function AdminTenantsPage() {
  await requireSuperAdminOrNotFound();
  const tenants = await getAdminTenantsList();

  return <AdminTenantsClient initialTenants={tenants} />;
}
