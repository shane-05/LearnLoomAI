-- Preserve existing LearnLoom data while aligning the foundation table names.
do $$
begin
  if to_regclass('public.profiles') is null and to_regclass('public.learning_profiles') is not null then
    alter table public.learning_profiles rename to profiles;
  end if;
  if to_regclass('public.user_skills') is null and to_regclass('public.student_skills') is not null then
    alter table public.student_skills rename to user_skills;
  end if;
  if to_regclass('public.career_roles') is null and to_regclass('public.career_catalogue') is not null then
    alter table public.career_catalogue rename to career_roles;
  end if;
  if to_regclass('public.roadmap_tasks') is null and to_regclass('public.learning_tasks') is not null then
    alter table public.learning_tasks rename to roadmap_tasks;
  end if;
end;
$$;

create or replace function private.is_learnloom_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function private.handle_learnloom_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy if exists career_catalogue_read on public.career_roles;
create policy career_roles_read on public.career_roles for select to anon, authenticated using (true);
drop policy if exists career_catalogue_admin_manage on public.career_roles;
create policy career_roles_admin_manage on public.career_roles for all to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
