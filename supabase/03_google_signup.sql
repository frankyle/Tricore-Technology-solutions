-- Google sign-in support.
-- Run in Supabase Dashboard -> SQL Editor AFTER schema.sql and
-- 02_technician_verification.sql. Google itself is turned on separately in
-- Authentication -> Providers (see README) — this file only adjusts the
-- database so a Google sign-in ends up with a role, same as an email sign-up.

-- 1. TRACK WHETHER A ROLE WAS CHOSEN --------------------------------------------
-- Email sign-up already asks "technician / company / requester" in the form.
-- Google sign-in skips that form, so new Google users land as 'requester'
-- with role_selected = false, and the app shows a one-time picker.
alter table public.profiles add column if not exists role_selected boolean not null default true;

-- Existing accounts already effectively "chose" their role; only new Google
-- sign-ups should see the picker, so this line only matters going forward.

-- 2. UPDATE THE SIGN-UP TRIGGER --------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url, role_selected)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' in ('technician','company','requester')
         then new.raw_user_meta_data->>'role' else 'requester' end,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'role' is not null   -- true for the email form, false for Google
  );
  return new;
end;
$$;

-- 3. LET A USER CHOOSE THEIR ROLE EXACTLY ONCE -----------------------------------
-- profiles.role is not directly writable from the browser (see schema.sql),
-- so this is the only way to set it after a Google sign-in.
create or replace function public.choose_role(new_role text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if new_role not in ('technician','company','requester') then
    raise exception 'Invalid role.';
  end if;
  update public.profiles
     set role = new_role, role_selected = true
   where id = auth.uid() and role_selected = false;
  if not found then
    raise exception 'Role already set.';
  end if;
end;
$$;

revoke execute on function public.choose_role(text) from public, anon;
grant  execute on function public.choose_role(text) to authenticated;
