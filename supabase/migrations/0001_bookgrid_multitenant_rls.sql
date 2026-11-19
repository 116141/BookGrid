-- ============================================================================
-- BOOKGRID (bookgrid.app/[slug]) — FASE 1: FUNDAÇÃO, MULTI-TENANT RLS & TRIGGERS
-- Company: GilByte Solutions
-- Currencies Supported: Exclusively USD ($) and EUR (€) via Paddle / Dodo -> Payoneer
-- Security Standard: OWASP Top 10 (Zero Anonymous PII Exposure, Strict Tenant Isolation)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABELA DE LOJISTAS / ASSINANTES (TENANTS)
-- ----------------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  business_name text not null check (char_length(trim(business_name)) between 2 and 100),
  niche text not null default 'barber' check (niche in ('barber', 'clinic', 'auto', 'realtor', 'general')),
  city text not null default 'Boston, MA / Lisbon, PT',
  whatsapp_phone text not null check (whatsapp_phone ~ '^\+?[1-9]\d{6,14}$'),
  currency text not null default 'USD' check (currency in ('USD', 'EUR')),
  opening_time text not null default '09:00' check (opening_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  closing_time text not null default '19:00' check (closing_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  max_staff_included int not null default 5 check (max_staff_included between 1 and 5),
  subscription_status text not null default 'trial' check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  payment_provider text not null default 'paddle' check (payment_provider in ('paddle', 'dodo')),
  external_subscription_id text,
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE MEMBROS DA EQUIPE (ATÉ 5 PROFISSIONAIS INCLUSOS SEM TAXA EXTRA)
-- ----------------------------------------------------------------------------
create table if not exists public.staff_members (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null check (char_length(trim(name)) between 2 and 80),
  role text not null default 'Specialist' check (char_length(trim(role)) between 2 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. TRIGGER DE QUOTA DE EQUIPE (MÁXIMO 5 PROFISSIONAIS ATIVOS POR TENANT)
-- ----------------------------------------------------------------------------
create or replace function public.enforce_max_staff_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_active_count int;
  v_max_allowed int;
begin
  if (new.active = true) then
    select coalesce(max_staff_included, 5)
      into v_max_allowed
      from public.tenants
     where id = new.tenant_id;

    select count(*)
      into v_current_active_count
      from public.staff_members
     where tenant_id = new.tenant_id
       and active = true
       and (tg_op = 'INSERT' or id <> new.id);

    if v_current_active_count >= coalesce(v_max_allowed, 5) then
      raise exception 'STAFF_QUOTA_EXCEEDED: BookGrid plan includes up to % active staff members per tenant.', coalesce(v_max_allowed, 5)
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_max_staff_quota on public.staff_members;
create trigger trg_enforce_max_staff_quota
before insert or update on public.staff_members
for each row execute function public.enforce_max_staff_quota();

-- ----------------------------------------------------------------------------
-- 4. TABELA DE SERVIÇOS (EXCLUSIVAMENTE USD & EUR + DURAÇÃO EM MINUTOS)
-- ----------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null check (char_length(trim(name)) between 2 and 100),
  duration_minutes int not null default 30 check (duration_minutes between 5 and 480),
  price_usd numeric(10,2) not null default 35.00 check (price_usd >= 0),
  price_eur numeric(10,2) not null default 25.00 check (price_eur >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. TABELA DE AGENDAMENTOS MULTI-SERVIÇOS (BOOKINGS)
-- ----------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  staff_id uuid references public.staff_members(id) on delete set null,
  staff_name text not null default 'Any Specialist',
  booking_code text not null,
  client_name text not null check (char_length(trim(client_name)) between 2 and 80),
  client_phone text not null check (client_phone ~ '^\+?[1-9]\d{6,14}$'),
  selected_services_json jsonb not null,
  total_duration_minutes int not null check (total_duration_minutes between 5 and 720),
  total_price_usd numeric(10,2) not null default 0 check (total_price_usd >= 0),
  total_price_eur numeric(10,2) not null default 0 check (total_price_eur >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'EUR')),
  booking_date date not null,
  booking_time text not null check (booking_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  source text not null default 'public_link' check (source in ('public_link', 'waitlist_fill', 'ai_importer', 'dashboard')),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'recovered_from_waitlist', 'completed', 'no_show')),
  created_at timestamptz not null default now()
);

-- ÍNDICE ÚNICO PARCIAL CONTRA DOUBLE-BOOKING SIMULTÂNEO (RACE CONDITION DEFENSE)
create unique index if not exists idx_bookings_no_double_booking
  on public.bookings (tenant_id, staff_id, booking_date, booking_time)
  where status in ('confirmed', 'recovered_from_waitlist') and staff_id is not null;

-- ----------------------------------------------------------------------------
-- 6. TABELA DE LISTA DE ESPERA INTELIGENTE ANTI-BURACOS (WAITLIST_ENTRIES)
-- ----------------------------------------------------------------------------
create table if not exists public.waitlist_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  client_name text not null check (char_length(trim(client_name)) between 2 and 80),
  client_phone text not null check (client_phone ~ '^\+?[1-9]\d{6,14}$'),
  desired_date date not null default current_date,
  desired_services_json jsonb not null,
  total_duration_minutes int not null check (total_duration_minutes between 5 and 720),
  total_price_usd numeric(10,2) not null default 0 check (total_price_usd >= 0),
  total_price_eur numeric(10,2) not null default 0 check (total_price_eur >= 0),
  preferred_time_window text not null default 'Anytime',
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'promoted_to_booking', 'expired')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. TABELA DE AUDITORIA DO IMPORTADOR IA & IDEMPOTÊNCIA DE WEBHOOKS
-- ----------------------------------------------------------------------------
create table if not exists public.ai_import_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  raw_input_hash text not null,
  extracted_count int not null default 0 check (extracted_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  event_id text primary key,
  provider text not null check (provider in ('paddle', 'dodo')),
  event_type text not null,
  tenant_id uuid references public.tenants(id) on delete set null,
  currency text check (currency in ('USD', 'EUR')),
  amount numeric(10,2),
  processed_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. FUNÇÃO DE PROPRIEDADE MULTI-TENANT & RPC PÚBLICA SEM EXPOSIÇÃO DE PII
-- ----------------------------------------------------------------------------
create or replace function public.is_tenant_owner(check_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
      from public.tenants t
     where t.id = check_tenant_id
       and t.owner_id = auth.uid()
  );
$$;

-- RPC Segura para a página pública bookgrid.app/[slug] consultar horários ocupados
-- Retorna APENAS intervalos bloqueados, NUNCA nomes ou telefones de clientes (Zero PII Leak)
create or replace function public.get_public_busy_slots(
  p_tenant_id uuid,
  p_booking_date date
)
returns table (
  staff_id uuid,
  booking_date date,
  booking_time text,
  total_duration_minutes int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    b.staff_id,
    b.booking_date,
    b.booking_time,
    b.total_duration_minutes
  from public.bookings b
  join public.tenants t on t.id = b.tenant_id
  where b.tenant_id = p_tenant_id
    and b.booking_date = p_booking_date
    and b.status in ('confirmed', 'recovered_from_waitlist')
    and t.subscription_status in ('trial', 'active');
$$;

grant execute on function public.get_public_busy_slots(uuid, date) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9. POLÍTICAS ESTRITAS DE ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.staff_members enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.ai_import_logs enable row level security;
alter table public.payment_webhook_events enable row level security;

-- TENANTS: Público lê vitrines ativas; somente o dono altera sua loja
create policy "tenants_public_select_active"
  on public.tenants for select
  to anon, authenticated
  using (subscription_status in ('trial', 'active'));

create policy "tenants_owner_insert"
  on public.tenants for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "tenants_owner_update"
  on public.tenants for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "tenants_owner_delete"
  on public.tenants for delete
  to authenticated
  using (owner_id = auth.uid());

-- STAFF_MEMBERS: Público lê membros ativos; somente o dono gerencia
create policy "staff_public_select_active"
  on public.staff_members for select
  to anon, authenticated
  using (active = true);

create policy "staff_owner_manage"
  on public.staff_members for all
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

-- SERVICES: Público lê serviços ativos; somente o dono gerencia
create policy "services_public_select_active"
  on public.services for select
  to anon, authenticated
  using (active = true);

create policy "services_owner_manage"
  on public.services for all
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

-- BOOKINGS: Público APENAS INSERE reserva nova; SOMENTE o dono lê/atualiza (Zero PII Leak)
create policy "bookings_public_insert_only"
  on public.bookings for insert
  to anon, authenticated
  with check (
    status = 'confirmed'
    and exists (
      select 1 from public.tenants t
       where t.id = tenant_id
         and t.subscription_status in ('trial', 'active')
    )
  );

create policy "bookings_owner_select"
  on public.bookings for select
  to authenticated
  using (public.is_tenant_owner(tenant_id));

create policy "bookings_owner_update"
  on public.bookings for update
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy "bookings_owner_delete"
  on public.bookings for delete
  to authenticated
  using (public.is_tenant_owner(tenant_id));

-- WAITLIST_ENTRIES: Público APENAS INSERE na fila; SOMENTE o dono lê/atualiza
create policy "waitlist_public_insert_only"
  on public.waitlist_entries for insert
  to anon, authenticated
  with check (
    status = 'waiting'
    and exists (
      select 1 from public.tenants t
       where t.id = tenant_id
         and t.subscription_status in ('trial', 'active')
    )
  );

create policy "waitlist_owner_manage"
  on public.waitlist_entries for all
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

-- AI_IMPORT_LOGS: Exclusivo do dono do tenant
create policy "ai_import_logs_owner_manage"
  on public.ai_import_logs for all
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));
