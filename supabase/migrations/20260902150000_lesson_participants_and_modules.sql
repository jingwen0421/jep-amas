-- =====================================================================
-- JEP AMAS — module-based scheduling with a flexible attendee roster
-- Generated: 2026-09-02
--
-- Problem: a scheduled `lessons` row currently points at exactly one
-- `batch_id`, so a single class session can only ever serve students of
-- one cohort. In practice some students are enrolled as part of a
-- company-paid batch, others enrolled individually (their own
-- "batch of one") — and the academy wants to be able to schedule ONE
-- session that draws its roster from either or both, plus pick up
-- anyone else in the course who still needs that module.
--
-- Fix: `lessons.batch_id` becomes optional (kept only as a display
-- label for "this session was scheduled from batch X"), `lessons` gains
-- `module_id` so a session is tied to real curriculum content, and a
-- new `lesson_participants` table becomes the authoritative attendee
-- roster — populated by batch expansion, individual pick, or
-- auto-eligible expansion, in any combination.
-- =====================================================================

alter table public.lessons
  add column if not exists module_id uuid references public.course_modules(id);

alter table public.lessons
  alter column batch_id drop not null;

comment on column public.lessons.batch_id is
  'Optional "primary" batch shown for display when a session was scheduled from a single batch. Not authoritative for attendance — see lesson_participants.';

comment on column public.lessons.module_id is
  'Curriculum module this scheduled session covers.';

create table if not exists public.lesson_participants (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  source text not null default 'batch' check (source in ('batch', 'individual', 'auto_eligible')),
  status text not null default 'scheduled' check (status in ('scheduled', 'excused', 'cancelled')),
  academy_id uuid not null references public.academies(id),
  created_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create index if not exists lesson_participants_student_idx on public.lesson_participants(student_id);
create index if not exists lesson_participants_lesson_idx on public.lesson_participants(lesson_id);

alter table public.lesson_participants enable row level security;

create policy lesson_participants_select_self on public.lesson_participants
  for select using (student_id = current_student_id());

create policy lesson_participants_select_staff on public.lesson_participants
  for select using (
    in_my_academy(academy_id) and (
      is_backoffice_staff()
      or is_academy_admin()
      or exists (
        select 1 from public.lessons l
        where l.id = lesson_participants.lesson_id
          and l.teacher_id = current_teacher_id()
      )
    )
  );

create policy lesson_participants_manage_admin on public.lesson_participants
  for all using (is_academy_admin() and in_my_academy(academy_id))
  with check (in_my_academy(academy_id));

create policy lesson_participants_manage_teacher on public.lesson_participants
  for all using (
    in_my_academy(academy_id)
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_participants.lesson_id
        and l.teacher_id = current_teacher_id()
    )
  )
  with check (
    in_my_academy(academy_id)
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_participants.lesson_id
        and l.teacher_id = current_teacher_id()
    )
  );

-- ---------------------------------------------------------------------
-- Auto-provision student_module_progress so eligibility is always known:
-- when a student enrolls, give them an 'eligible' row for every existing
-- module of their course; when a course gains a new module, give every
-- actively-enrolled student of that course an 'eligible' row for it.
-- ---------------------------------------------------------------------

create or replace function public.provision_module_progress_for_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_module_progress (enrollment_id, module_id, status)
  select new.id, cm.id, 'eligible'
  from public.course_modules cm
  join public.class_batches cb on cb.id = new.batch_id
  where cm.course_id = cb.course_id
  on conflict (enrollment_id, module_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_provision_module_progress_enrollment on public.enrollments;
create trigger trg_provision_module_progress_enrollment
  after insert on public.enrollments
  for each row execute function public.provision_module_progress_for_enrollment();

create or replace function public.provision_module_progress_for_module()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_module_progress (enrollment_id, module_id, status)
  select e.id, new.id, 'eligible'
  from public.enrollments e
  join public.class_batches cb on cb.id = e.batch_id
  where cb.course_id = new.course_id
    and e.enrollment_status = 'active'
  on conflict (enrollment_id, module_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_provision_module_progress_module on public.course_modules;
create trigger trg_provision_module_progress_module
  after insert on public.course_modules
  for each row execute function public.provision_module_progress_for_module();
