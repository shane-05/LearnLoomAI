-- Keep SECURITY DEFINER functions out of the PostgREST-exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_learnloom_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.learning_profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function private.is_learnloom_admin() from public, anon, authenticated;
grant execute on function private.is_learnloom_admin() to authenticated;

create or replace function private.handle_learnloom_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.learning_profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_learnloom_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_learnloom on auth.users;
create trigger on_auth_user_created_learnloom after insert on auth.users
for each row execute function private.handle_learnloom_new_user();

drop policy if exists career_catalogue_admin_manage on public.career_catalogue;
create policy career_catalogue_admin_manage on public.career_catalogue for all to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
drop policy if exists skills_admin_manage on public.skills;
create policy skills_admin_manage on public.skills for all to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
drop policy if exists career_requirements_admin_manage on public.career_requirements;
create policy career_requirements_admin_manage on public.career_requirements for all to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
drop policy if exists resources_admin_manage on public.learning_resources;
create policy resources_admin_manage on public.learning_resources for all to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
drop policy if exists opportunities_admin_manage on public.opportunities;
create policy opportunities_admin_manage on public.opportunities for all to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));

drop function if exists public.handle_learnloom_new_user();
drop function if exists public.is_learnloom_admin();
