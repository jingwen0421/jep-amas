-- =====================================================================
-- JEP AMAS — auto-fill academy_id on insert (closes a live bug)
-- Generated: 2026-09-02
--
-- Found while building module-based scheduling: none of the app's
-- existing insert calls (Class Scheduling, Appointment Booking, Makeup
-- Classes, etc.) ever set `academy_id` — it relied entirely on a
-- one-time backfill of historical rows earlier this session. Any NEW
-- row created since then gets academy_id = NULL, which is invisible to
-- everyone under RLS except super_admin, and for `lessons` specifically
-- it's worse: the calendar sync trigger copies `academy_id` straight
-- into `calendar_events`, which has a NOT NULL constraint there — so
-- every new "Schedule Class" submission would fail outright with a
-- not-null violation.
--
-- Fix: a BEFORE INSERT trigger that fills academy_id from the calling
-- user's own academy when the app didn't supply one, falling back to
-- the one canonical academy that exists today. Purely additive — never
-- overrides a value the app already set.
-- =====================================================================

create or replace function public.set_academy_id_from_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.academy_id is null then
    new.academy_id := coalesce(
      current_academy_id(),
      '951c9a25-2e64-4e10-adf9-ff387afaece3'::uuid
    );
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
  tables text[] := array[
    'appointments', 'attendance', 'audit_logs', 'certificates',
    'class_batches', 'classrooms', 'course_categories', 'courses',
    'documents', 'enrollments', 'installments', 'lessons',
    'makeup_classes', 'notifications', 'payment_plans', 'payments',
    'portfolio_feedback', 'portfolio_items', 'receipts',
    'registration_applications', 'students', 'surveys',
    'teacher_availability', 'teachers', 'users',
    'events', 'service_bookings', 'lesson_participants'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists trg_set_academy_id on public.%I;',
      t
    );
    execute format(
      'create trigger trg_set_academy_id before insert on public.%I
         for each row execute function public.set_academy_id_from_session();',
      t
    );
  end loop;
end $$;
