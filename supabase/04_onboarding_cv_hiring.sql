-- Tricore: guided onboarding, site photos (3 to 10), CV upload, company hiring.
-- Run in Supabase Dashboard -> SQL Editor AFTER 03_google_signup.sql. Safe to run once.
--
-- What this adds
--   * site_photos      3 to 10 photos per technician or company (the person shown at work)
--   * technicians.cv_path + private 'cvs' bucket
--   * companies.phone / services / website
--   * vacancies        jobs a company is hiring for
--   * applications     a technician applying to a vacancy (company sees profile + CV)
--   * submit_technician_for_review now asks for 3 to 10 site photos instead of 5 projects
--     (projects stay available as an optional extra)

-- 1. EXTRA COLUMNS ---------------------------------------------------------------
alter table public.technicians add column if not exists cv_path text;
grant insert (cv_path) on public.technicians to authenticated;
grant update (cv_path) on public.technicians to authenticated;

alter table public.companies
  add column if not exists phone    text,
  add column if not exists website  text,
  add column if not exists services text[] not null default '{}';
grant insert (phone, website, services) on public.companies to authenticated;
grant update (phone, website, services) on public.companies to authenticated;

-- 2. SITE PHOTOS -----------------------------------------------------------------
-- owner_id is the profile id of the technician or the company owner.
create table if not exists public.site_photos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,                  -- '<user_id>/site/<file>' in bucket 'portfolio'
  created_at   timestamptz not null default now()
);
create index if not exists site_photos_owner_idx on public.site_photos (owner_id, created_at);

create or replace function public.enforce_site_photo_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.site_photos where owner_id = new.owner_id) >= 10 then
    raise exception 'You can add a maximum of 10 site photos.';
  end if;
  return new;
end;
$$;
drop trigger if exists site_photos_limit on public.site_photos;
create trigger site_photos_limit before insert on public.site_photos
  for each row execute function public.enforce_site_photo_limit();

-- Technicians cannot change photos while the profile is under review or approved
-- (same rule as certificates and projects). Companies can always edit.
create or replace function public.can_edit_site_photos()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.technicians t
    where t.id = auth.uid() and t.status in ('pending','approved')
  )
$$;

alter table public.site_photos enable row level security;

create policy "site photos add" on public.site_photos for insert to authenticated
  with check (owner_id = auth.uid() and public.can_edit_site_photos());
create policy "site photos remove" on public.site_photos for delete to authenticated
  using (owner_id = auth.uid() and public.can_edit_site_photos());

-- 3. VACANCIES + APPLICATIONS ------------------------------------------------------
create table if not exists public.vacancies (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  city        text,
  job_type    text not null default 'full_time'
              check (job_type in ('full_time','part_time','contract','internship')),
  skills      text[] not null default '{}',
  contact     text,
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now()
);
create index if not exists vacancies_status_idx on public.vacancies (status, created_at desc);

create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  vacancy_id    uuid not null references public.vacancies(id) on delete cascade,
  technician_id uuid not null references public.technicians(id) on delete cascade,
  note          text,
  contact       text,                           -- phone/WhatsApp the technician chose to share
  status        text not null default 'applied'
                check (status in ('applied','shortlisted','hired','rejected')),
  created_at    timestamptz not null default now(),
  unique (vacancy_id, technician_id)
);
create index if not exists applications_vacancy_idx on public.applications (vacancy_id);

grant insert (company_id, owner_id, title, description, city, job_type, skills, contact)
  on public.vacancies to authenticated;
grant update (title, description, city, job_type, skills, contact, status)
  on public.vacancies to authenticated;
grant insert (vacancy_id, technician_id, note, contact) on public.applications to authenticated;
grant update (status) on public.applications to authenticated;

alter table public.vacancies    enable row level security;
alter table public.applications enable row level security;

create policy "vacancies read" on public.vacancies for select
  using (status = 'open' or owner_id = auth.uid() or public.is_admin());
create policy "vacancies insert" on public.vacancies for insert to authenticated
  with check (owner_id = auth.uid()
              and exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy "vacancies update" on public.vacancies for update to authenticated
  using (owner_id = auth.uid());
create policy "vacancies delete" on public.vacancies for delete to authenticated
  using (owner_id = auth.uid());

create policy "applications read" on public.applications for select to authenticated
  using (technician_id = auth.uid()
         or exists (select 1 from public.vacancies v where v.id = vacancy_id and v.owner_id = auth.uid()));
create policy "applications insert" on public.applications for insert to authenticated
  with check (technician_id = auth.uid()
              and exists (select 1 from public.vacancies v where v.id = vacancy_id and v.status = 'open'));
create policy "applications company update" on public.applications for update to authenticated
  using (exists (select 1 from public.vacancies v where v.id = vacancy_id and v.owner_id = auth.uid()));
create policy "applications withdraw" on public.applications for delete to authenticated
  using (technician_id = auth.uid());

-- Site photos are readable by the owner, admins, the public (approved technicians and
-- companies) and a hiring company looking at an applicant.
create policy "site photos read" on public.site_photos for select
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.technicians t
               where t.id = owner_id and t.is_public and t.status = 'approved')
    or exists (select 1 from public.companies c where c.owner_id = site_photos.owner_id)
    or exists (select 1 from public.applications a
               join public.vacancies v on v.id = a.vacancy_id
               where a.technician_id = site_photos.owner_id and v.owner_id = auth.uid())
  );
-- A hiring company may open the profile of anyone who applied to its vacancies,
-- even if that profile has not been approved yet.
create policy "applicants visible to hiring company" on public.technicians for select to authenticated
  using (exists (select 1 from public.applications a
                 join public.vacancies v on v.id = a.vacancy_id
                 where a.technician_id = technicians.id and v.owner_id = auth.uid()));

-- 4. STORAGE: PRIVATE CV FILES --------------------------------------------------------
-- A CV is only readable by its owner, Tricore admins, and a company that the
-- technician applied to.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880,
        array['application/pdf','application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "cvs read" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (select 1 from public.applications a
               join public.vacancies v on v.id = a.vacancy_id
               where a.technician_id::text = (storage.foldername(name))[1]
                 and v.owner_id = auth.uid())
  ));
create policy "cvs insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cvs delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 5. SUBMIT FOR REVIEW: 3 to 10 SITE PHOTOS INSTEAD OF 5 PROJECTS ---------------------
create or replace function public.submit_technician_for_review()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  t       public.technicians%rowtype;
  ph      text;
  missing text[] := '{}';
  n       int;
begin
  select * into t from public.technicians where id = auth.uid();
  if not found then
    raise exception 'Save your profile first.';
  end if;
  if t.status not in ('draft','changes_requested') then
    raise exception 'Your profile is already %.', t.status;
  end if;

  select p.phone into ph from public.profiles p where p.id = auth.uid();
  if coalesce(trim(ph), '') = ''                     then missing := array_append(missing, 'phone number'); end if;
  if t.photo_path is null                            then missing := array_append(missing, 'profile photo'); end if;
  if coalesce(trim(t.headline), '') = ''             then missing := array_append(missing, 'headline'); end if;
  if coalesce(trim(t.bio), '') = ''                  then missing := array_append(missing, 'about you'); end if;
  if coalesce(trim(t.city), '') = ''                 then missing := array_append(missing, 'city'); end if;
  if cardinality(t.skills) = 0                       then missing := array_append(missing, 'skills'); end if;
  if t.years_experience is null                      then missing := array_append(missing, 'years of experience'); end if;

  select count(*) into n from public.certifications where technician_id = t.id;
  if n = 0 then missing := array_append(missing, 'at least one certification'); end if;

  select count(*) into n from public.site_photos where owner_id = t.id;
  if n < 3 then missing := array_append(missing, format('at least 3 site photos (you have %s)', n)); end if;

  if cardinality(missing) > 0 then
    raise exception 'Incomplete: %', array_to_string(missing, '; ');
  end if;

  update public.technicians set status = 'pending', submitted_at = now() where id = t.id;
end;
$$;
