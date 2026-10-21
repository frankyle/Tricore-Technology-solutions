-- Tricore Technician Verification
-- Run in Supabase Dashboard -> SQL Editor AFTER schema.sql. Safe on a project
-- that already has technicians (see step 7 for what happens to them).
--
-- Flow:  draft -> (technician submits) pending -> (admin) approved
--                                              \-> changes_requested -> draft-like, technician fixes and resubmits
-- Only 'approved' technicians appear in the public directory.

-- 1. ADMIN FLAG ---------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;
-- Users can never set is_admin: profiles only grants update on full_name/phone/avatar_url.

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

-- 2. TECHNICIAN COLUMNS -------------------------------------------------------
alter table public.technicians
  add column if not exists photo_path   text,          -- profile photo, bucket 'portfolio'
  add column if not exists status       text not null default 'draft'
        check (status in ('draft','pending','approved','changes_requested')),
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at  timestamptz;

-- photo_path is writable by the technician; status/submitted_at/reviewed_at are not
-- (they are only changed by the functions further down).
grant insert (photo_path) on public.technicians to authenticated;
grant update (photo_path) on public.technicians to authenticated;

-- 3. NEW TABLES -----------------------------------------------------------------
create table if not exists public.certifications (
  id               uuid primary key default gen_random_uuid(),
  technician_id    uuid not null references public.technicians(id) on delete cascade,
  brand            text not null,                 -- Hikvision, Dahua, Gallagher, IDS, Other...
  title            text not null,                 -- e.g. "Hikvision Certified Security Associate"
  issued_on        date,
  certificate_path text not null,                 -- file in PRIVATE bucket 'certificates'
  created_at       timestamptz not null default now()
);

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  title         text not null,
  description   text,                             -- the installation that was done
  technologies  text[] not null default '{}',     -- equipment / technologies used
  integrations  text,                             -- integrations that were done
  created_at    timestamptz not null default now()
);

create table if not exists public.project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  technician_id uuid not null references public.technicians(id) on delete cascade,
  storage_path  text not null,                    -- bucket 'portfolio'
  created_at    timestamptz not null default now()
);

-- Admin decisions log. The note is private: only the technician and admins can read it.
create table if not exists public.technician_reviews (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  decision      text not null check (decision in ('approved','changes_requested')),
  note          text,
  reviewed_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists certifications_tech_idx on public.certifications (technician_id);
create index if not exists projects_tech_idx       on public.projects (technician_id);
create index if not exists project_images_proj_idx on public.project_images (project_id);
create index if not exists technicians_status_idx  on public.technicians (status);
create index if not exists reviews_tech_idx        on public.technician_reviews (technician_id, created_at desc);

-- 4. LIMITS: max 5 projects, max 4 images per project ---------------------------
create or replace function public.enforce_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'projects' then
    if (select count(*) from public.projects where technician_id = new.technician_id) >= 5 then
      raise exception 'You can add a maximum of 5 projects.';
    end if;
  elsif tg_table_name = 'project_images' then
    if (select count(*) from public.project_images where project_id = new.project_id) >= 4 then
      raise exception 'Each project can have a maximum of 4 images.';
    end if;
  elsif tg_table_name = 'certifications' then
    if (select count(*) from public.certifications where technician_id = new.technician_id) >= 15 then
      raise exception 'You can add a maximum of 15 certifications.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists projects_limit on public.projects;
create trigger projects_limit before insert on public.projects
  for each row execute function public.enforce_limits();
drop trigger if exists project_images_limit on public.project_images;
create trigger project_images_limit before insert on public.project_images
  for each row execute function public.enforce_limits();
drop trigger if exists certifications_limit on public.certifications;
create trigger certifications_limit before insert on public.certifications
  for each row execute function public.enforce_limits();

-- 5. LOCKING: what the technician may change, and when ---------------------------
-- Certificates, projects and images can only be edited while the profile is a
-- draft or has changes requested. While 'pending' nothing that the admin is
-- reviewing can change under his feet. After 'approved', text fields stay editable
-- but the photo, certificates and projects are locked (admin can send it back).
create or replace function public.can_edit_profile()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.technicians t
    where t.id = auth.uid() and t.status in ('draft','changes_requested')
  )
$$;

create or replace function public.technicians_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if old.status in ('pending','approved') and new.photo_path is distinct from old.photo_path then
    raise exception 'Your photo is locked while your profile is under review or approved.';
  end if;
  if old.status = 'pending'
     and (new.display_name, new.headline, new.bio, new.skills, new.city, new.years_experience)
         is distinct from
         (old.display_name, old.headline, old.bio, old.skills, old.city, old.years_experience) then
    raise exception 'Your profile is under review and cannot be edited right now.';
  end if;
  return new;
end;
$$;

drop trigger if exists technicians_guard_trg on public.technicians;
create trigger technicians_guard_trg before update on public.technicians
  for each row execute function public.technicians_guard();

-- 6. ROW LEVEL SECURITY -------------------------------------------------------------
alter table public.certifications      enable row level security;
alter table public.projects            enable row level security;
alter table public.project_images      enable row level security;
alter table public.technician_reviews  enable row level security;

-- technicians: public sees only approved + public. Owner sees own. Admin sees all.
drop policy if exists "technicians public read" on public.technicians;
create policy "technicians public read" on public.technicians for select
  using ((is_public and status = 'approved') or id = auth.uid() or public.is_admin());

-- admin can read every profile (needs the private phone number to contact people)
create policy "admin read profiles" on public.profiles for select to authenticated
  using (public.is_admin());

-- legacy portfolio table: hide it with unapproved technicians too
drop policy if exists "portfolio public read" on public.portfolio_items;
create policy "portfolio public read" on public.portfolio_items for select
  using (technician_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.technicians t
    where t.id = technician_id and t.is_public and t.status = 'approved'));

-- certifications / projects / project_images: same visibility rule, owner edits while editable
create policy "certifications read" on public.certifications for select
  using (technician_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.technicians t
    where t.id = technician_id and t.is_public and t.status = 'approved'));
create policy "certifications write" on public.certifications for insert to authenticated
  with check (technician_id = auth.uid() and public.can_edit_profile());
create policy "certifications edit" on public.certifications for update to authenticated
  using (technician_id = auth.uid() and public.can_edit_profile());
create policy "certifications remove" on public.certifications for delete to authenticated
  using (technician_id = auth.uid() and public.can_edit_profile());

create policy "projects read" on public.projects for select
  using (technician_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.technicians t
    where t.id = technician_id and t.is_public and t.status = 'approved'));
create policy "projects write" on public.projects for insert to authenticated
  with check (technician_id = auth.uid() and public.can_edit_profile());
create policy "projects edit" on public.projects for update to authenticated
  using (technician_id = auth.uid() and public.can_edit_profile());
create policy "projects remove" on public.projects for delete to authenticated
  using (technician_id = auth.uid() and public.can_edit_profile());

create policy "project images read" on public.project_images for select
  using (technician_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.technicians t
    where t.id = technician_id and t.is_public and t.status = 'approved'));
create policy "project images write" on public.project_images for insert to authenticated
  with check (
    technician_id = auth.uid() and public.can_edit_profile()
    and exists (select 1 from public.projects p where p.id = project_id and p.technician_id = auth.uid()));
create policy "project images remove" on public.project_images for delete to authenticated
  using (technician_id = auth.uid() and public.can_edit_profile());

-- reviews: technician reads own notes, admin reads all. Nobody inserts directly.
create policy "reviews read" on public.technician_reviews for select to authenticated
  using (technician_id = auth.uid() or public.is_admin());

-- 7. EXISTING TECHNICIANS -----------------------------------------------------------
-- Anyone already marked verified stays visible. Everyone else becomes a draft and
-- has to complete the new profile and be approved.
update public.technicians set status = 'approved' where verified = true and status = 'draft';

-- 8. SUBMIT + REVIEW FUNCTIONS -----------------------------------------------------
-- Completeness is checked here on the server, so it cannot be skipped from the browser.
create or replace function public.submit_technician_for_review()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  t       public.technicians%rowtype;
  ph      text;
  missing text[] := '{}';
  proj    record;
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

  select count(*) into n from public.projects where technician_id = t.id;
  if n <> 5 then missing := array_append(missing, format('exactly 5 projects (you have %s)', n)); end if;

  for proj in select * from public.projects where technician_id = t.id loop
    if coalesce(trim(proj.description), '') = ''
       or cardinality(proj.technologies) = 0
       or coalesce(trim(proj.integrations), '') = ''
       or (select count(*) from public.project_images i where i.project_id = proj.id) <> 4 then
      missing := array_append(missing, format('full details and 4 images for project "%s"', proj.title));
    end if;
  end loop;

  if cardinality(missing) > 0 then
    raise exception 'Incomplete: %', array_to_string(missing, '; ');
  end if;

  update public.technicians set status = 'pending', submitted_at = now() where id = t.id;
end;
$$;

create or replace function public.review_technician(tech_id uuid, decision text, note text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  cur text;
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;
  if decision not in ('approved','changes_requested') then
    raise exception 'Invalid decision.';
  end if;
  select status into cur from public.technicians where id = tech_id;
  if cur is null then
    raise exception 'Technician not found.';
  end if;
  if decision = 'approved' and cur <> 'pending' then
    raise exception 'Only profiles that were submitted for review can be approved.';
  end if;
  if decision = 'changes_requested' and coalesce(trim(note), '') = '' then
    raise exception 'Write a note so the technician knows what to fix.';
  end if;

  update public.technicians
     set status = decision, verified = (decision = 'approved'), reviewed_at = now()
   where id = tech_id;
  insert into public.technician_reviews (technician_id, decision, note, reviewed_by)
  values (tech_id, decision, nullif(trim(note), ''), auth.uid());
end;
$$;

revoke execute on function public.submit_technician_for_review()        from public, anon;
revoke execute on function public.review_technician(uuid, text, text)   from public, anon;
grant  execute on function public.submit_technician_for_review()        to authenticated;
grant  execute on function public.review_technician(uuid, text, text)   to authenticated;

-- 9. STORAGE: PRIVATE CERTIFICATE FILES -------------------------------------------------
-- Certificates can carry personal details, so they are NOT public. Only the owner
-- and admins can open them. Visitors see the certification name, brand and year
-- on the technician page with the "verified by Tricore" badge.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', false, 5242880,
        array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "certificates read" on storage.objects for select to authenticated
  using (bucket_id = 'certificates'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "certificates insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "certificates delete" on storage.objects for delete to authenticated
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);

-- 10. MAKE YOURSELF ADMIN -------------------------------------------------------------------
-- Sign up on the site first, then run this once with YOUR email:
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'your@email.com');
