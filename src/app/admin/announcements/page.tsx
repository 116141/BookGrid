import { requireSuperAdminOrNotFound } from '@/lib/auth/super-admin';
import { getSystemAnnouncements } from '@/services/admin/admin-queries.service';
import { AdminAnnouncementsClient } from '@/components/admin/AdminAnnouncementsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  await requireSuperAdminOrNotFound();
  const { rows, migrationMissing } = await getSystemAnnouncements();

  return <AdminAnnouncementsClient initialRows={rows} migrationMissing={migrationMissing} />;
}
