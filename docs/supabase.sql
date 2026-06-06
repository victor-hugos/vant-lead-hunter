create extension if not exists pgcrypto;

create table if not exists public.lead_hunter_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche text not null,
  location text not null,
  goal text not null,
  offer text not null,
  sender_email text not null default 'admin@vant.business',
  tone text not null default 'direto e cordial',
  criteria text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_hunter_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.lead_hunter_campaigns(id) on delete cascade,
  name text not null,
  category text,
  area text,
  whatsapp text,
  email text,
  instagram text,
  site text,
  notes text,
  status text not null default 'Novo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_hunter_campaigns enable row level security;
alter table public.lead_hunter_leads enable row level security;

drop policy if exists "lead hunter campaigns public read" on public.lead_hunter_campaigns;
drop policy if exists "lead hunter campaigns public insert" on public.lead_hunter_campaigns;
drop policy if exists "lead hunter campaigns public update" on public.lead_hunter_campaigns;
drop policy if exists "lead hunter leads public read" on public.lead_hunter_leads;
drop policy if exists "lead hunter leads public insert" on public.lead_hunter_leads;
drop policy if exists "lead hunter leads public update" on public.lead_hunter_leads;

create policy "lead hunter campaigns public read"
on public.lead_hunter_campaigns for select
to anon
using (true);

create policy "lead hunter campaigns public insert"
on public.lead_hunter_campaigns for insert
to anon
with check (true);

create policy "lead hunter campaigns public update"
on public.lead_hunter_campaigns for update
to anon
using (true)
with check (true);

create policy "lead hunter leads public read"
on public.lead_hunter_leads for select
to anon
using (true);

create policy "lead hunter leads public insert"
on public.lead_hunter_leads for insert
to anon
with check (true);

create policy "lead hunter leads public update"
on public.lead_hunter_leads for update
to anon
using (true)
with check (true);
