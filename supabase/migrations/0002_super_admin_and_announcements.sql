-- ============================================================================
-- BOOKGRID SUPER ADMIN, SYSTEM ANNOUNCEMENTS & AUDIT LOGS (MIGRATION 0002)
-- ============================================================================

-- 1. Expand `tenants.subscription_status` to support Super Admin overrides (`vip`, `suspended`)
ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_subscription_status_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'vip', 'suspended', 'past_due', 'canceled'));

-- Allow public booking pages to read active VIP tenants as well
DROP POLICY IF EXISTS tenants_public_storefront_read ON public.tenants;
CREATE POLICY tenants_public_storefront_read
  ON public.tenants
  FOR SELECT
  TO anon, authenticated
  USING (subscription_status IN ('trial', 'active', 'vip'));

-- 2. System Announcements Table (Global Banner for /(dashboard))
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 4 AND 500),
  tone TEXT NOT NULL DEFAULT 'info' CHECK (tone IN ('info', 'warning', 'success')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_authenticated_read_active ON public.system_announcements;
CREATE POLICY announcements_authenticated_read_active
  ON public.system_announcements
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. Super Admin Audit Logs (Service Role Only — Zero public/authenticated access)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_tenant_id UUID NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
