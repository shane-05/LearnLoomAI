-- LearnLoom extension migration. Existing learning_profiles, student_skills,
-- learning_tasks, and career_catalogue are reused rather than duplicated.

alter table public.learning_profiles
  add column if not exists role text not null default 'student'
  check (role in ('student', 'admin'));

create or replace function public.is_learnloom_admin()
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

create or replace function public.handle_learnloom_new_user()
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

drop trigger if exists on_auth_user_created_learnloom on auth.users;
create trigger on_auth_user_created_learnloom after insert on auth.users
for each row execute function public.handle_learnloom_new_user();

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'Other',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.career_catalogue add column if not exists updated_at timestamptz not null default now();

create table if not exists public.career_requirements (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.career_catalogue(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  skill_name text not null,
  required_proficiency smallint not null default 3 check (required_proficiency between 1 and 5),
  weight numeric(5,2) not null default 1 check (weight > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (career_id, skill_name)
);

insert into public.skills (name, category)
select distinct jsonb_array_elements_text(coalesce(c.required_skills, '[]'::jsonb)), c.category
from public.career_catalogue c
on conflict (name) do nothing;

insert into public.career_requirements (career_id, skill_id, skill_name, required_proficiency, weight)
select c.id, s.id, required.name, 3, 1
from public.career_catalogue c
cross join lateral jsonb_array_elements_text(coalesce(c.required_skills, '[]'::jsonb)) as required(name)
left join public.skills s on lower(s.name) = lower(required.name)
on conflict (career_id, skill_name) do nothing;

alter table public.student_skills
  add column if not exists skill_id uuid references public.skills(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.learning_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id uuid references public.career_catalogue(id) on delete set null,
  title text not null,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_tasks
  add column if not exists roadmap_id uuid references public.learning_roadmaps(id) on delete cascade,
  add column if not exists description text,
  add column if not exists position integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  score numeric(5,2) not null check (score between 0 and 100),
  total_questions integer not null check (total_questions > 0),
  correct_answers integer not null check (correct_answers between 0 and total_questions),
  answers jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null unique,
  resource_type text not null default 'article',
  skill_id uuid references public.skills(id) on delete set null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.mentor_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  agent_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  category text not null,
  description text,
  application_url text not null unique,
  deadline timestamptz,
  eligibility text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunity_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists student_skills_user_idx on public.student_skills(user_id);
create index if not exists roadmaps_user_status_idx on public.learning_roadmaps(user_id, status);
create index if not exists learning_tasks_user_roadmap_idx on public.learning_tasks(user_id, roadmap_id, position);
create index if not exists assessment_attempts_user_completed_idx on public.assessment_attempts(user_id, completed_at desc);
create index if not exists mentor_conversations_user_updated_idx on public.mentor_conversations(user_id, updated_at desc);
create index if not exists mentor_messages_conversation_created_idx on public.mentor_messages(conversation_id, created_at);
create index if not exists progress_logs_user_created_idx on public.progress_logs(user_id, created_at desc);
create index if not exists opportunity_bookmarks_user_idx on public.opportunity_bookmarks(user_id);
create index if not exists career_requirements_career_idx on public.career_requirements(career_id);

create or replace function public.set_learnloom_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'learning_profiles', 'student_skills', 'learning_tasks', 'career_catalogue',
    'skills', 'career_requirements', 'learning_roadmaps', 'assessment_attempts',
    'learning_resources', 'mentor_conversations', 'opportunities'
  ] loop
    execute format('drop trigger if exists learnloom_set_updated_at on public.%I', table_name);
    execute format('create trigger learnloom_set_updated_at before update on public.%I for each row execute function public.set_learnloom_updated_at()', table_name);
  end loop;
end;
$$;

alter table public.learning_profiles enable row level security;
alter table public.student_skills enable row level security;
alter table public.learning_tasks enable row level security;
alter table public.career_catalogue enable row level security;
alter table public.skills enable row level security;
alter table public.career_requirements enable row level security;
alter table public.learning_roadmaps enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.learning_resources enable row level security;
alter table public.mentor_conversations enable row level security;
alter table public.mentor_messages enable row level security;
alter table public.progress_logs enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_bookmarks enable row level security;

drop policy if exists learning_profiles_owner on public.learning_profiles;
create policy learning_profiles_owner on public.learning_profiles for select to authenticated using ((select auth.uid()) = id);
create policy learning_profiles_update_owner on public.learning_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists student_skills_owner on public.student_skills;
create policy student_skills_read_owner on public.student_skills for select to authenticated using ((select auth.uid()) = user_id);
create policy student_skills_insert_self_reported on public.student_skills for insert to authenticated with check ((select auth.uid()) = user_id and verification_status = 'self-reported');
create policy student_skills_update_self_reported on public.student_skills for update to authenticated using ((select auth.uid()) = user_id and verification_status = 'self-reported') with check ((select auth.uid()) = user_id and verification_status = 'self-reported');
create policy student_skills_delete_owner on public.student_skills for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists learning_tasks_owner on public.learning_tasks;
create policy learning_tasks_owner on public.learning_tasks for all to authenticated using ((select auth.uid()) = user_id and (roadmap_id is null or exists (select 1 from public.learning_roadmaps r where r.id = roadmap_id and r.user_id = (select auth.uid())))) with check ((select auth.uid()) = user_id and (roadmap_id is null or exists (select 1 from public.learning_roadmaps r where r.id = roadmap_id and r.user_id = (select auth.uid()))));
drop policy if exists career_catalogue_read on public.career_catalogue;
create policy career_catalogue_read on public.career_catalogue for select to anon, authenticated using (true);
create policy career_catalogue_admin_manage on public.career_catalogue for all to authenticated using ((select public.is_learnloom_admin())) with check ((select public.is_learnloom_admin()));

create policy skills_read on public.skills for select to anon, authenticated using (true);
create policy skills_admin_manage on public.skills for all to authenticated using ((select public.is_learnloom_admin())) with check ((select public.is_learnloom_admin()));
create policy career_requirements_read on public.career_requirements for select to anon, authenticated using (true);
create policy career_requirements_admin_manage on public.career_requirements for all to authenticated using ((select public.is_learnloom_admin())) with check ((select public.is_learnloom_admin()));
create policy roadmaps_owner on public.learning_roadmaps for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy assessments_read_owner on public.assessment_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy resources_read on public.learning_resources for select to anon, authenticated using (true);
create policy resources_admin_manage on public.learning_resources for all to authenticated using ((select public.is_learnloom_admin())) with check ((select public.is_learnloom_admin()));
create policy conversations_owner on public.mentor_conversations for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy mentor_messages_read_owner on public.mentor_messages for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.mentor_conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy mentor_messages_user_insert on public.mentor_messages for insert to authenticated with check ((select auth.uid()) = user_id and role = 'user' and exists (select 1 from public.mentor_conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy progress_owner on public.progress_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy opportunities_read on public.opportunities for select to anon, authenticated using (true);
create policy opportunities_admin_manage on public.opportunities for all to authenticated using ((select public.is_learnloom_admin())) with check ((select public.is_learnloom_admin()));
create policy bookmarks_owner on public.opportunity_bookmarks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke insert, update, delete on public.learning_profiles from authenticated;
revoke update on public.learning_profiles from authenticated;
grant select on public.learning_profiles to authenticated;
grant update (display_name, target_career, updated_at) on public.learning_profiles to authenticated;
grant select on public.career_catalogue, public.skills, public.career_requirements, public.learning_resources, public.opportunities to anon, authenticated;
grant select, insert, update, delete on public.student_skills, public.learning_tasks, public.learning_roadmaps, public.mentor_conversations, public.mentor_messages, public.opportunity_bookmarks to authenticated;
grant select on public.assessment_attempts, public.progress_logs to authenticated;
grant select, insert, update, delete on public.career_catalogue, public.skills, public.career_requirements, public.learning_resources, public.opportunities to authenticated;
