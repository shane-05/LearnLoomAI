-- Remove obsolete API-exposed security-definer helpers. Current policies and auth trigger use private functions.
drop function if exists public.handle_learnloom_new_user();
drop function if exists public.is_learnloom_admin();

-- Keep public catalogue reads and scope mutations to administrators without overlapping SELECT policies.
drop policy if exists career_roles_admin_manage on public.career_roles;
create policy career_roles_admin_insert on public.career_roles for insert to authenticated with check ((select private.is_learnloom_admin()));
create policy career_roles_admin_update on public.career_roles for update to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
create policy career_roles_admin_delete on public.career_roles for delete to authenticated using ((select private.is_learnloom_admin()));

drop policy if exists skills_admin_manage on public.skills;
create policy skills_admin_insert on public.skills for insert to authenticated with check ((select private.is_learnloom_admin()));
create policy skills_admin_update on public.skills for update to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
create policy skills_admin_delete on public.skills for delete to authenticated using ((select private.is_learnloom_admin()));

drop policy if exists career_requirements_admin_manage on public.career_requirements;
create policy career_requirements_admin_insert on public.career_requirements for insert to authenticated with check ((select private.is_learnloom_admin()));
create policy career_requirements_admin_update on public.career_requirements for update to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
create policy career_requirements_admin_delete on public.career_requirements for delete to authenticated using ((select private.is_learnloom_admin()));

drop policy if exists resources_admin_manage on public.learning_resources;
create policy resources_admin_insert on public.learning_resources for insert to authenticated with check ((select private.is_learnloom_admin()));
create policy resources_admin_update on public.learning_resources for update to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
create policy resources_admin_delete on public.learning_resources for delete to authenticated using ((select private.is_learnloom_admin()));

drop policy if exists opportunities_admin_manage on public.opportunities;
create policy opportunities_admin_insert on public.opportunities for insert to authenticated with check ((select private.is_learnloom_admin()));
create policy opportunities_admin_update on public.opportunities for update to authenticated using ((select private.is_learnloom_admin())) with check ((select private.is_learnloom_admin()));
create policy opportunities_admin_delete on public.opportunities for delete to authenticated using ((select private.is_learnloom_admin()));

-- Index foreign-key columns used in lookups, joins, and ownership checks.
create index if not exists assessment_attempts_skill_id_idx on public.assessment_attempts(skill_id);
create index if not exists career_requirements_skill_id_idx on public.career_requirements(skill_id);
create index if not exists learning_resources_skill_id_idx on public.learning_resources(skill_id);
create index if not exists learning_roadmaps_career_id_idx on public.learning_roadmaps(career_id);
create index if not exists mentor_messages_user_role_created_idx on public.mentor_messages(user_id, role, created_at desc);
create index if not exists opportunity_bookmarks_opportunity_id_idx on public.opportunity_bookmarks(opportunity_id);
create index if not exists roadmap_tasks_roadmap_id_idx on public.roadmap_tasks(roadmap_id);
create index if not exists user_skills_skill_id_idx on public.user_skills(skill_id);
