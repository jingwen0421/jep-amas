-- =====================================================================
-- AMAS · Calendar-Centric Foundation
-- =====================================================================
-- Purpose : Additive schema for the calendar-centric pivot. Introduces
--           course curriculum (modules), per-student module progress,
--           a unified calendar_events layer, public event registration,
--           student-initiated reschedule requests, and a lightweight
--           external/client service-booking table for revenue tracking.
--
-- Scope   : ADD ONLY. Nothing here drops, renames or alters an existing
--           table or column. Existing tables (students, users, teachers,
--           courses, course_categories, class_batches, enrollments,
--           lessons, attendance, teacher_availability, makeup_classes,
--           appointments, payments, installments, payment_plans,
--           receipts, certificates, crm_*, discounts, notifications,
--           registration_applications, leave_requests) are untouched.
--           Deprecating/removing the self-service "teacher booking"
--           flow (per business decision: admin assigns classes, so
--           student-initiated consultation booking is not needed) is
--           an application-layer change, not a DB one — no table here
--           is dropped for it.
--
-- Business rules encoded here (confirmed 2026-09-02):
--   - A student holds at most one ACTIVE course enrollment at a time,
--     but may hold unlimited event_registrations in parallel.
--   - Modules may be completed in parallel; ordering is enforced only
--     where an explicit prerequisite edge exists (course_module_prerequisites).
--   - A module may have multiple parallel scheduled sessions, limited
--     only by teacher/venue availability.
--   - A teacher (and a venue) can never be double-booked: enforced with
--     a DB-level EXCLUDE constraint on calendar_events, not just app logic.
--   - Venue capacity rules apply identically to academic classes and
--     public events (both flow through calendar_events + event_occurrences,
--     both reference the same classrooms/venue table).
--   - "Daily earning" includes completed external/client services and
--     completed public events, not only payments received — see
--     service_bookings.revenue_amount and calendar_events of type
--     'external_service' / 'public_event' with status 'completed'.
--
-- Apply   : supabase db push   (or paste into the SQL editor, in order)
-- Safe to re-run: yes — every statement is IF NOT EXISTS / OR REPLACE.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions & shared trigger helper
-- ---------------------------------------------------------------------

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- required for EXCLUDE on uuid + tstzrange

-- Namespaced so it can never collide with an existing updated_at trigger fn.
create or replace function public.amas_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

do $$ begin
  create type module_progress_status as enum ('locked','eligible','in_progress','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type calendar_event_type as enum ('class','makeup_class','external_service','public_event','internal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type calendar_event_status as enum ('scheduled','completed','cancelled','rescheduled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_registration_status as enum ('pending','confirmed','cancelled','waitlisted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reschedule_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Course curriculum: modules + prerequisites
-- ---------------------------------------------------------------------
-- Curriculum now lives at the COURSE level (reusable across every batch),
-- separate from any one scheduled occurrence. This is the split that
-- lessons.tsx currently conflates (a "lesson" today is both the
-- curriculum item AND the batch-scoped occurrence).

create table if not exists public.course_modules (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses(id) on delete cascade,
  module_code       text,
  title             text not null,
  description       text,
  sequence          integer not null default 1,
  is_required       boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (course_id, sequence)
);

drop trigger if exists trg_course_modules_updated_at on public.course_modules;
create trigger trg_course_modules_updated_at
  before update on public.course_modules
  for each row execute function public.amas_touch_updated_at();

create index if not exists idx_course_modules_course on public.course_modules(course_id);

-- Self-referential prerequisite graph. Absence of a row = no ordering
-- constraint between the two modules (parallel by default, per the
-- confirmed business rule).
create table if not exists public.course_module_prerequisites (
  id                      uuid primary key default gen_random_uuid(),
  module_id               uuid not null references public.course_modules(id) on delete cascade,
  prerequisite_module_id  uuid not null references public.course_modules(id) on delete cascade,
  created_at              timestamptz not null default now(),
  check (module_id <> prerequisite_module_id),
  unique (module_id, prerequisite_module_id)
);

create index if not exists idx_module_prereq_module on public.course_module_prerequisites(module_id);
create index if not exists idx_module_prereq_prereq on public.course_module_prerequisites(prerequisite_module_id);

-- ---------------------------------------------------------------------
-- 3. Student module progress
-- ---------------------------------------------------------------------
-- Replaces the current derived-from-attendance-count approximation
-- (see StudentProgress.tsx) with an explicit, auditable record per
-- student per module.

create table if not exists public.student_module_progress (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references public.enrollments(id) on delete cascade,
  module_id       uuid not null references public.course_modules(id) on delete cascade,
  status          module_progress_status not null default 'eligible',
  lesson_id       uuid references public.lessons(id) on delete set null, -- occurrence that completed it, if any
  completed_at    timestamptz,
  completed_by    uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (enrollment_id, module_id)
);

drop trigger if exists trg_student_module_progress_updated_at on public.student_module_progress;
create trigger trg_student_module_progress_updated_at
  before update on public.student_module_progress
  for each row execute function public.amas_touch_updated_at();

create index if not exists idx_smp_enrollment on public.student_module_progress(enrollment_id);
create index if not exists idx_smp_module on public.student_module_progress(module_id);
create index if not exists idx_smp_status on public.student_module_progress(status);

-- ---------------------------------------------------------------------
-- 4. calendar_events — the unifying operational layer
-- ---------------------------------------------------------------------
-- One row per "thing happening at a time". References the underlying
-- domain record (lessons / makeup_classes / service_bookings /
-- event_occurrences) rather than duplicating its data. teacher_id and
-- venue_id are denormalized onto this table specifically so the DB can
-- enforce no-double-booking with a single EXCLUDE constraint per resource.

create table if not exists public.calendar_events (
  id            uuid primary key default gen_random_uuid(),
  event_type    calendar_event_type not null,
  source_table  text not null,   -- 'lessons' | 'makeup_classes' | 'service_bookings' | 'event_occurrences'
  source_id     uuid not null,   -- id in that source table
  title         text not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  teacher_id    uuid references public.teachers(id) on delete set null,
  venue_id      uuid references public.classrooms(id) on delete set null,
  status        calendar_event_status not null default 'scheduled',
  notes         text,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (source_table, source_id)
);

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.amas_touch_updated_at();

create index if not exists idx_calendar_events_starts_at on public.calendar_events(starts_at);
create index if not exists idx_calendar_events_teacher on public.calendar_events(teacher_id);
create index if not exists idx_calendar_events_venue on public.calendar_events(venue_id);
create index if not exists idx_calendar_events_type on public.calendar_events(event_type);

-- Hard guarantee: a teacher cannot be double-booked on two active
-- (non-cancelled) events with overlapping time ranges.
alter table public.calendar_events
  drop constraint if exists calendar_events_no_teacher_overlap;
alter table public.calendar_events
  add constraint calendar_events_no_teacher_overlap
  exclude using gist (
    teacher_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled' and teacher_id is not null);

-- Same guarantee for venues — capacity/double-booking applies identically
-- to academic classes and public events, per the confirmed business rule.
alter table public.calendar_events
  drop constraint if exists calendar_events_no_venue_overlap;
alter table public.calendar_events
  add constraint calendar_events_no_venue_overlap
  exclude using gist (
    venue_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled' and venue_id is not null);

-- ---------------------------------------------------------------------
-- 5. Public events: catalogue → occurrence → registration
-- ---------------------------------------------------------------------

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  event_kind    text not null default 'workshop', -- trial_class | pro_class_1to1 | competition | workshop | other
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.amas_touch_updated_at();

create table if not exists public.event_occurrences (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  venue_id      uuid references public.classrooms(id) on delete set null,
  capacity      integer,
  status        calendar_event_status not null default 'scheduled',
  price         numeric(10,2) default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

drop trigger if exists trg_event_occurrences_updated_at on public.event_occurrences;
create trigger trg_event_occurrences_updated_at
  before update on public.event_occurrences
  for each row execute function public.amas_touch_updated_at();

create index if not exists idx_event_occurrences_event on public.event_occurrences(event_id);
create index if not exists idx_event_occurrences_starts_at on public.event_occurrences(starts_at);

create table if not exists public.event_registrations (
  id              uuid primary key default gen_random_uuid(),
  occurrence_id   uuid not null references public.event_occurrences(id) on delete cascade,
  student_id      uuid references public.students(id) on delete set null, -- nullable: public/non-student registrants
  guest_name      text,
  guest_phone     text,
  guest_email     text,
  status          event_registration_status not null default 'pending',
  registered_at   timestamptz not null default now(),
  check (student_id is not null or guest_name is not null)
);

create index if not exists idx_event_registrations_occurrence on public.event_registrations(occurrence_id);
create index if not exists idx_event_registrations_student on public.event_registrations(student_id);

-- ---------------------------------------------------------------------
-- 6. Student-initiated reschedule requests
-- ---------------------------------------------------------------------
-- A student requests a change to an already-scheduled class; Admin
-- reviews and either assigns a new calendar_events row or rejects.
-- This is the workflow kept from the old "appointments" idea — the
-- self-service consultation-booking flow itself is not being rebuilt.

create table if not exists public.reschedule_requests (
  id                    uuid primary key default gen_random_uuid(),
  calendar_event_id     uuid not null references public.calendar_events(id) on delete cascade,
  student_id            uuid not null references public.students(id) on delete cascade,
  reason                text,
  preferred_period      text,
  status                reschedule_status not null default 'pending',
  new_calendar_event_id uuid references public.calendar_events(id) on delete set null,
  reviewed_by           uuid references public.users(id) on delete set null,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_reschedule_requests_updated_at on public.reschedule_requests;
create trigger trg_reschedule_requests_updated_at
  before update on public.reschedule_requests
  for each row execute function public.amas_touch_updated_at();

create index if not exists idx_reschedule_requests_event on public.reschedule_requests(calendar_event_id);
create index if not exists idx_reschedule_requests_student on public.reschedule_requests(student_id);
create index if not exists idx_reschedule_requests_status on public.reschedule_requests(status);

-- ---------------------------------------------------------------------
-- 7. External / client-facing service bookings (revenue-bearing)
-- ---------------------------------------------------------------------
-- Off-site or client-facing work (e.g. a bridal makeup service, an
-- external engagement) that isn't a course class but should still show
-- on the calendar and count toward daily revenue once completed.
-- Admin-created — not a student/public self-service flow.

create table if not exists public.service_bookings (
  id                uuid primary key default gen_random_uuid(),
  client_name       text not null,
  service_type      text not null,
  staff_id          uuid references public.teachers(id) on delete set null,
  location          text,
  revenue_amount    numeric(10,2) not null default 0,
  status            calendar_event_status not null default 'scheduled',
  created_by        uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_service_bookings_updated_at on public.service_bookings;
create trigger trg_service_bookings_updated_at
  before update on public.service_bookings
  for each row execute function public.amas_touch_updated_at();

create index if not exists idx_service_bookings_staff on public.service_bookings(staff_id);
create index if not exists idx_service_bookings_status on public.service_bookings(status);

-- ---------------------------------------------------------------------
-- 8. One active enrollment per student — enforced, not just conventional
-- ---------------------------------------------------------------------
-- Confirmed rule: a student may hold at most one ACTIVE course
-- enrollment at a time (unlimited event_registrations are fine — those
-- are a separate table). This assumes enrollments has a text/enum
-- `enrollment_status` column with an 'active' value, matching the
-- `enrollment_status` field already read in StudentProgress.tsx.
-- Adjust the column/value name below if your enum differs before running.

drop index if exists idx_one_active_enrollment_per_student;
create unique index idx_one_active_enrollment_per_student
  on public.enrollments (student_id)
  where (enrollment_status = 'active');

-- ---------------------------------------------------------------------
-- 9. Row Level Security — enabled, deny-by-default
-- ---------------------------------------------------------------------
-- New tables start locked down (service role only) until explicit
-- policies are added — matching the existing app's use of RLS rather
-- than opening broad anonymous/public access by accident.
-- TODO before go-live: add per-role policies (admin/teacher/student)
-- mirroring the pattern already used on your existing tables.

alter table public.course_modules              enable row level security;
alter table public.course_module_prerequisites  enable row level security;
alter table public.student_module_progress      enable row level security;
alter table public.calendar_events              enable row level security;
alter table public.events                       enable row level security;
alter table public.event_occurrences            enable row level security;
alter table public.event_registrations          enable row level security;
alter table public.reschedule_requests          enable row level security;
alter table public.service_bookings             enable row level security;

-- =====================================================================
-- End of migration
-- =====================================================================
