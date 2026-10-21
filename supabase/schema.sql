-- Tricore Technician Marketplace: schema + Row Level Security + storage
-- Run in Supabase Dashboard -> SQL Editor. Safe to run on a fresh project.

-- 1. TABLES ---------------------------------------------------------------

-- Private account row (one per signed-up user). Holds the plan so a paid
-- registration fee can be switched on later without changing the schema.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'requester'
              check (role in ('technician','company','requester')),
  full_name   text,
  phone       text,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free','paid')),
  paid_until  timestamptz,
  created_at  timestamptz not null default now()
);

create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  city        text,
  logo_url    text,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Public technician profile (phone stays private in profiles).
create table public.technicians (
  id               uuid primary key references public.profiles(id) on delete cascade,
  company_id       uuid references public.companies(id) on delete set null,
  display_name     text not null,
  headline         text,
  bio              text,
  skills           text[] not null default '{}',
  city             text,
  years_experience int check (years_experience >= 0),
  is_public        boolean not null default true,
  verified         boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.portfolio_items (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  media_type    text not null check (media_type in ('image','video')),
  storage_path  text not null,          -- e.g. '<user_id>/<file>.jpg' in bucket 'portfolio'
  title         text,
  description   text,
  created_at    timestamptz not null default now()
);

-- A client or company asks for help. Leave technician_id and company_id
-- empty for an open request, or set one to address it directly.
create table public.job_requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  technician_id uuid references public.technicians(id) on delete set null,
  company_id    uuid references public.companies(id) on delete set null,
  title         text not null,
  description   text,
  city          text,
  contact       text,                   -- phone/WhatsApp shown to technicians
  status        text not null default 'open'
                check (status in ('open','assigned','closed')),
  created_at    timestamptz not null default now()
);

create index on public.technicians (city);
create index on public.technicians using gin (skills);
create index on public.portfolio_items (technician_id);
create index on public.job_requests (status, created_at desc);

-- 2. AUTO-CREATE PROFILE ON SIGN-UP -----------------------------------------
-- Frontend passes the role: supabase.auth.signUp({ email, password,
--   options: { data: { role: 'technician', full_name: '...' } } })

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' in ('technician','company','requester')
         then new.raw_user_meta_data->>'role' else 'requester' end,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. COLUMN PERMISSIONS ------------------------------------------------------
-- Users must never be able to set their own verified / plan / paid_until,
-- so only safe columns are writable from the browser.

revoke insert, update on public.profiles         from anon, authenticated;
revoke insert, update on public.companies        from anon, authenticated;
revoke insert, update on public.technicians      from anon, authenticated;

grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

grant insert (owner_id, name, description, city, logo_url) on public.companies to authenticated;
grant update (name, description, city, logo_url)           on public.companies to authenticated;

-- company_id is left out on purpose: company-technician links come later.
grant insert (id, display_name, headline, bio, skills, city, years_experience, is_public)
  on public.technicians to authenticated;
grant update (display_name, headline, bio, skills, city, years_experience, is_public)
  on public.technicians to authenticated;

-- 4. ROW LEVEL SECURITY --------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.companies       enable row level security;
alter table public.technicians     enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.job_requests    enable row level security;

-- profiles: private to the owner
create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

-- companies: public directory, owner manages
create policy "companies public read" on public.companies for select using (true);
create policy "companies owner insert" on public.companies for insert to authenticated with check (owner_id = auth.uid());
create policy "companies owner update" on public.companies for update to authenticated using (owner_id = auth.uid());
create policy "companies owner delete" on public.companies for delete to authenticated using (owner_id = auth.uid());

-- technicians: public profiles are visible to everyone, owner manages
create policy "technicians public read" on public.technicians for select
  using (is_public or id = auth.uid());
create policy "technicians own insert" on public.technicians for insert to authenticated
  with check (
    id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'technician')
  );
create policy "technicians own update" on public.technicians for update to authenticated using (id = auth.uid());
create policy "technicians own delete" on public.technicians for delete to authenticated using (id = auth.uid());

-- portfolio: visible with the technician, owner manages
create policy "portfolio public read" on public.portfolio_items for select
  using (exists (select 1 from public.technicians t
                 where t.id = technician_id and (t.is_public or t.id = auth.uid())));
create policy "portfolio own insert" on public.portfolio_items for insert to authenticated
  with check (technician_id = auth.uid());
create policy "portfolio own update" on public.portfolio_items for update to authenticated
  using (technician_id = auth.uid());
create policy "portfolio own delete" on public.portfolio_items for delete to authenticated
  using (technician_id = auth.uid());

-- job requests: requester, addressed technician/company owner, and (for open
-- requests) any signed-in technician or company can see them
create policy "jobs read" on public.job_requests for select to authenticated
  using (
    requester_id = auth.uid()
    or technician_id = auth.uid()
    or company_id in (select c.id from public.companies c where c.owner_id = auth.uid())
    or (
      status = 'open' and technician_id is null and company_id is null
      and exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role in ('technician','company'))
    )
  );
create policy "jobs insert" on public.job_requests for insert to authenticated
  with check (requester_id = auth.uid());
create policy "jobs requester update" on public.job_requests for update to authenticated
  using (requester_id = auth.uid());
create policy "jobs requester delete" on public.job_requests for delete to authenticated
  using (requester_id = auth.uid());

-- 5. STORAGE: PORTFOLIO MEDIA -------------------------------------------------
-- Bucket limit is 50 MB; the 2 MB image limit is enforced in the frontend.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 52428800,
        array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do nothing;

-- Anyone can view; users upload/change/delete only inside their own folder
create policy "portfolio files read" on storage.objects for select
  using (bucket_id = 'portfolio');
create policy "portfolio files insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portfolio files update" on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portfolio files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

-- LATER, when you start charging: set profiles.plan = 'paid' and paid_until
-- from a payment webhook (service role), then gate features on those columns.
-- Verified badges: set technicians.verified / companies.verified from the
-- Supabase dashboard or an admin-only function.
