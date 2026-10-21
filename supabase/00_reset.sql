-- FACTORY RESET for this project's database.
-- Deletes every table, function and policy in the public schema — no matter
-- what state it's currently in — then rebuilds an empty public schema with
-- the permissions Supabase needs to keep working. This cannot fail with
-- "already exists" or "does not exist" errors, because it doesn't check for
-- individual objects: it removes the whole schema and starts over.
--
-- WARNING: this deletes ALL tables in the public schema of THIS Supabase
-- project — not just Tricore's. If this same project also stores data for
-- something else, back it up first. It does NOT touch Supabase Authentication
-- (your logins stay) or Storage files — those are handled separately below.

drop schema public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all   on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables    to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;

create extension if not exists pgcrypto;

-- Clears any leftover storage policies tied to the old functions above.
drop policy if exists "portfolio files read"   on storage.objects;
drop policy if exists "portfolio files insert" on storage.objects;
drop policy if exists "portfolio files update" on storage.objects;
drop policy if exists "portfolio files delete" on storage.objects;
drop policy if exists "certificates read"      on storage.objects;
drop policy if exists "certificates insert"    on storage.objects;
drop policy if exists "certificates delete"    on storage.objects;

-- The 'portfolio' and 'certificates' STORAGE BUCKETS and their files are not
-- touched by this script (Supabase blocks deleting them via SQL). Leaving
-- them is harmless — schema.sql and 02_technician_verification.sql recreate
-- them with "on conflict do nothing" if they already exist. To remove them
-- completely instead: Dashboard -> Storage -> open 'portfolio' -> select all
-- files -> Delete -> back out -> ⋮ next to 'portfolio' -> Delete bucket.
-- Repeat for 'certificates'. Do this before step 2 below if you want it.
