-- Round 2: Re-audit on pricing change
-- Run this in Supabase SQL editor before testing/deploying the Round 2 flow.

create extension if not exists "pgcrypto";

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  input_stack jsonb,
  output_result jsonb,
  pricing_snapshot jsonb,
  is_unsubscribed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.audits
  add column if not exists user_email text,
  add column if not exists input_stack jsonb,
  add column if not exists output_result jsonb,
  add column if not exists pricing_snapshot jsonb,
  add column if not exists is_unsubscribed boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.pricing_changes (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  old_pricing jsonb,
  new_pricing jsonb,
  affected_audits_count integer not null default 0,
  changed_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.audits(id) on delete cascade,
  user_email text not null,
  email_type text not null,
  sent_at timestamptz not null default now(),
  clicked boolean not null default false,
  clicked_at timestamptz
);

create index if not exists audits_user_email_idx
  on public.audits (user_email);

create index if not exists audits_created_at_idx
  on public.audits (created_at desc);

create index if not exists pricing_changes_changed_at_idx
  on public.pricing_changes (changed_at desc);

create index if not exists email_logs_audit_id_idx
  on public.email_logs (audit_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists audits_set_updated_at on public.audits;
create trigger audits_set_updated_at
before update on public.audits
for each row execute function public.set_updated_at();

alter table public.audits enable row level security;
alter table public.pricing_changes enable row level security;
alter table public.email_logs enable row level security;
