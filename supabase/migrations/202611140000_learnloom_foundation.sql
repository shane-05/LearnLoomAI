-- LearnLoom foundation tables. These tables are reused by the module extension
-- migration instead of creating duplicate learning_profiles, skills, careers, or tasks.

create table if not exists public.learning_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  target_career text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Other',
  proficiency smallint check (proficiency between 1 and 5),
  evidence text,
  verification_status text not null default 'self-reported' check (verification_status in ('self-reported','verified')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.learning_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  stage text not null,
  estimated_minutes integer not null default 30 check (estimated_minutes > 0),
  completed_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.career_catalogue (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  category text not null,
  description text not null,
  required_skills jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.learning_profiles enable row level security;
alter table public.student_skills enable row level security;
alter table public.learning_tasks enable row level security;
alter table public.career_catalogue enable row level security;

drop policy if exists learning_profiles_owner on public.learning_profiles;
create policy learning_profiles_owner on public.learning_profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists student_skills_owner on public.student_skills;
create policy student_skills_owner on public.student_skills for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists learning_tasks_owner on public.learning_tasks;
create policy learning_tasks_owner on public.learning_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists career_catalogue_read on public.career_catalogue;
create policy career_catalogue_read on public.career_catalogue for select to anon, authenticated using (true);

grant select, insert, update, delete on public.learning_profiles to authenticated;
grant select, insert, update, delete on public.student_skills to authenticated;
grant select, insert, update, delete on public.learning_tasks to authenticated;
grant select on public.career_catalogue to anon, authenticated;

insert into public.career_catalogue (title, category, description, required_skills) values
('Full Stack Developer','Engineering','Build end-to-end digital products, connecting thoughtful interfaces with reliable services.','["JavaScript","React","Node.js","SQL","APIs"]'::jsonb),
('Frontend Developer','Engineering','Shape the interfaces people use every day with accessible, responsive web experiences.','["JavaScript","React","HTML & CSS","Accessibility","Testing"]'::jsonb),
('Backend Developer','Engineering','Design the systems, data layers and APIs that power dependable products.','["Node.js","SQL","APIs","System design","Testing"]'::jsonb),
('Data Analyst','Data','Turn complex information into clear insights that help teams make better decisions.','["SQL","Python","Statistics","Data visualization","Communication"]'::jsonb),
('UI/UX Designer','Design','Make digital products easier to understand through research, interaction and visual craft.','["User research","Figma","Prototyping","Interaction design","Accessibility"]'::jsonb),
('VLSI Design Engineer','Engineering','Develop and verify integrated circuits for the next generation of electronic devices.','["Digital logic","Verilog","Computer architecture","Verification","Semiconductors"]'::jsonb)
on conflict (title) do nothing;
