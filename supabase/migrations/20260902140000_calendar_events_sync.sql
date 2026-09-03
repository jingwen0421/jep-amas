-- =====================================================================
-- JEP AMAS — calendar_events sync layer
-- Generated: 2026-09-02
--
-- Makes calendar_events the real, DB-enforced source of truth for
-- teacher/venue double-booking. Whenever a row is written to lessons,
-- appointments, makeup_classes, or event_occurrences, a trigger mirrors
-- it into calendar_events (matched by source_table + source_id). Because
-- calendar_events carries the EXCLUDE USING gist constraints added in
-- 20260902120000_calendar_centric_foundation.sql, a write that would
-- double-book a teacher or a room is rejected right there with a plain
-- error message, regardless of which screen made the write.
--
-- calendar_sync_conflicts logs any *pre-existing* rows (created before
-- this protection existed) that conflict with something else — those
-- are backfilled as best-effort and flagged for the admin scheduling
-- workflow to resolve, rather than blocking this migration.
--
-- service_bookings is intentionally NOT synced — it has no start/end
-- time (it's an after-the-fact revenue log, not a scheduled booking) so
-- there is nothing to check for overlap.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Conflict log for pre-existing double-bookings found during backfill
-- ---------------------------------------------------------------------
create table if not exists public.calendar_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid not null,
  conflict_message text not null,
  detected_at timestamptz not null default now()
);

alter table public.calendar_sync_conflicts enable row level security;

create policy calendar_sync_conflicts_select on public.calendar_sync_conflicts
  for select using (public.is_academy_leadership());

comment on table public.calendar_sync_conflicts is
  'Rows that could not be mirrored into calendar_events because they overlap an existing teacher/venue booking. Surfaced to admins for manual resolution.';

-- ---------------------------------------------------------------------
-- lessons -> calendar_events
-- ---------------------------------------------------------------------
create or replace function public.sync_lesson_to_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status calendar_event_status;
  v_title text;
begin
  if TG_OP = 'DELETE' then
    delete from calendar_events where source_table = 'lessons' and source_id = old.id;
    return old;
  end if;

  if new.lesson_datetime is null then
    delete from calendar_events where source_table = 'lessons' and source_id = new.id;
    return new;
  end if;

  v_status := case
    when new.status = 'completed' then 'completed'::calendar_event_status
    when new.status in ('inactive', 'suspended', 'rejected') then 'cancelled'::calendar_event_status
    else 'scheduled'::calendar_event_status
  end;

  select c.course_name into v_title
  from class_batches b
  left join courses c on c.id = b.course_id
  where b.id = new.batch_id;

  begin
    insert into calendar_events (
      event_type, source_table, source_id, title, starts_at, ends_at,
      teacher_id, venue_id, status, academy_id
    ) values (
      'class', 'lessons', new.id, coalesce(v_title, new.lesson_title, 'Class'),
      new.lesson_datetime,
      new.lesson_datetime + make_interval(mins => coalesce(new.duration_minutes, 180)),
      new.teacher_id, new.classroom_id, v_status, new.academy_id
    )
    on conflict (source_table, source_id) do update set
      title = excluded.title,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      teacher_id = excluded.teacher_id,
      venue_id = excluded.venue_id,
      status = excluded.status,
      academy_id = excluded.academy_id,
      updated_at = now();
  exception
    when exclusion_violation then
      raise exception 'Scheduling conflict: the assigned teacher or classroom is already booked for an overlapping time.'
        using errcode = '23P01';
  end;

  return new;
end;
$$;

drop trigger if exists trg_sync_lesson_to_calendar_event on public.lessons;
create trigger trg_sync_lesson_to_calendar_event
  after insert or update or delete on public.lessons
  for each row execute function public.sync_lesson_to_calendar_event();

-- ---------------------------------------------------------------------
-- appointments -> calendar_events
-- ---------------------------------------------------------------------
create or replace function public.sync_appointment_to_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status calendar_event_status;
begin
  if TG_OP = 'DELETE' then
    delete from calendar_events where source_table = 'appointments' and source_id = old.id;
    return old;
  end if;

  if new.appointment_datetime is null then
    delete from calendar_events where source_table = 'appointments' and source_id = new.id;
    return new;
  end if;

  v_status := case
    when new.appointment_status = 'completed' then 'completed'::calendar_event_status
    when new.appointment_status in ('cancelled', 'rejected') then 'cancelled'::calendar_event_status
    when new.appointment_status = 'rescheduled' then 'rescheduled'::calendar_event_status
    else 'scheduled'::calendar_event_status
  end;

  begin
    insert into calendar_events (
      event_type, source_table, source_id, title, starts_at, ends_at,
      teacher_id, venue_id, status, academy_id
    ) values (
      'appointment', 'appointments', new.id, coalesce(new.purpose, 'Appointment'),
      new.appointment_datetime,
      new.appointment_datetime + make_interval(mins => coalesce(new.duration_minutes, 30)),
      new.teacher_id, null, v_status, new.academy_id
    )
    on conflict (source_table, source_id) do update set
      title = excluded.title,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      teacher_id = excluded.teacher_id,
      status = excluded.status,
      academy_id = excluded.academy_id,
      updated_at = now();
  exception
    when exclusion_violation then
      raise exception 'Scheduling conflict: this teacher already has another session booked at that time.'
        using errcode = '23P01';
  end;

  return new;
end;
$$;

drop trigger if exists trg_sync_appointment_to_calendar_event on public.appointments;
create trigger trg_sync_appointment_to_calendar_event
  after insert or update or delete on public.appointments
  for each row execute function public.sync_appointment_to_calendar_event();

-- ---------------------------------------------------------------------
-- makeup_classes -> calendar_events
-- ---------------------------------------------------------------------
create or replace function public.sync_makeup_class_to_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status calendar_event_status;
begin
  if TG_OP = 'DELETE' then
    delete from calendar_events where source_table = 'makeup_classes' and source_id = old.id;
    return old;
  end if;

  if new.makeup_datetime is null then
    delete from calendar_events where source_table = 'makeup_classes' and source_id = new.id;
    return new;
  end if;

  v_status := case
    when lower(coalesce(new.status, '')) = 'completed' then 'completed'::calendar_event_status
    when lower(coalesce(new.status, '')) in ('cancelled', 'canceled') then 'cancelled'::calendar_event_status
    else 'scheduled'::calendar_event_status
  end;

  begin
    insert into calendar_events (
      event_type, source_table, source_id, title, starts_at, ends_at,
      teacher_id, venue_id, status, academy_id
    ) values (
      'makeup_class', 'makeup_classes', new.id,
      coalesce('Makeup: ' || new.reason, 'Makeup Class'),
      new.makeup_datetime,
      new.makeup_datetime + interval '180 minutes',
      new.teacher_id, null, v_status, new.academy_id
    )
    on conflict (source_table, source_id) do update set
      title = excluded.title,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      teacher_id = excluded.teacher_id,
      status = excluded.status,
      academy_id = excluded.academy_id,
      updated_at = now();
  exception
    when exclusion_violation then
      raise exception 'Scheduling conflict: this teacher already has another session booked at that time.'
        using errcode = '23P01';
  end;

  return new;
end;
$$;

drop trigger if exists trg_sync_makeup_class_to_calendar_event on public.makeup_classes;
create trigger trg_sync_makeup_class_to_calendar_event
  after insert or update or delete on public.makeup_classes
  for each row execute function public.sync_makeup_class_to_calendar_event();

-- ---------------------------------------------------------------------
-- event_occurrences -> calendar_events
-- ---------------------------------------------------------------------
create or replace function public.sync_event_occurrence_to_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_academy_id uuid;
begin
  if TG_OP = 'DELETE' then
    delete from calendar_events where source_table = 'event_occurrences' and source_id = old.id;
    return old;
  end if;

  if new.starts_at is null or new.ends_at is null then
    delete from calendar_events where source_table = 'event_occurrences' and source_id = new.id;
    return new;
  end if;

  select e.title, e.academy_id into v_title, v_academy_id
  from events e where e.id = new.event_id;

  begin
    insert into calendar_events (
      event_type, source_table, source_id, title, starts_at, ends_at,
      teacher_id, venue_id, status, academy_id
    ) values (
      'public_event', 'event_occurrences', new.id, coalesce(v_title, 'Academy Event'),
      new.starts_at, new.ends_at, null, new.venue_id, new.status, v_academy_id
    )
    on conflict (source_table, source_id) do update set
      title = excluded.title,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      venue_id = excluded.venue_id,
      status = excluded.status,
      academy_id = excluded.academy_id,
      updated_at = now();
  exception
    when exclusion_violation then
      raise exception 'Scheduling conflict: this venue is already booked for another session at that time.'
        using errcode = '23P01';
  end;

  return new;
end;
$$;

drop trigger if exists trg_sync_event_occurrence_to_calendar_event on public.event_occurrences;
create trigger trg_sync_event_occurrence_to_calendar_event
  after insert or update or delete on public.event_occurrences
  for each row execute function public.sync_event_occurrence_to_calendar_event();

-- ---------------------------------------------------------------------
-- One-time backfill for rows that already existed before this sync
-- layer existed. Conflicts are logged, not raised, so pre-existing test
-- data can't block this migration.
-- ---------------------------------------------------------------------
do $$
declare
  r record;
  v_status calendar_event_status;
begin
  for r in
    select l.*, c.course_name
    from lessons l
    left join class_batches b on b.id = l.batch_id
    left join courses c on c.id = b.course_id
    where l.lesson_datetime is not null
  loop
    v_status := case
      when r.status = 'completed' then 'completed'::calendar_event_status
      when r.status in ('inactive', 'suspended', 'rejected') then 'cancelled'::calendar_event_status
      else 'scheduled'::calendar_event_status
    end;

    begin
      insert into calendar_events (
        event_type, source_table, source_id, title, starts_at, ends_at,
        teacher_id, venue_id, status, academy_id
      ) values (
        'class', 'lessons', r.id, coalesce(r.course_name, r.lesson_title, 'Class'),
        r.lesson_datetime,
        r.lesson_datetime + make_interval(mins => coalesce(r.duration_minutes, 180)),
        r.teacher_id, r.classroom_id, v_status, r.academy_id
      )
      on conflict (source_table, source_id) do nothing;
    exception
      when exclusion_violation then
        insert into calendar_sync_conflicts (source_table, source_id, conflict_message)
        values ('lessons', r.id, 'Teacher or classroom already booked for an overlapping time range.');
    end;
  end loop;

  for r in select * from appointments where appointment_datetime is not null
  loop
    v_status := case
      when r.appointment_status = 'completed' then 'completed'::calendar_event_status
      when r.appointment_status in ('cancelled', 'rejected') then 'cancelled'::calendar_event_status
      when r.appointment_status = 'rescheduled' then 'rescheduled'::calendar_event_status
      else 'scheduled'::calendar_event_status
    end;

    begin
      insert into calendar_events (
        event_type, source_table, source_id, title, starts_at, ends_at,
        teacher_id, venue_id, status, academy_id
      ) values (
        'appointment', 'appointments', r.id, coalesce(r.purpose, 'Appointment'),
        r.appointment_datetime,
        r.appointment_datetime + make_interval(mins => coalesce(r.duration_minutes, 30)),
        r.teacher_id, null, v_status, r.academy_id
      )
      on conflict (source_table, source_id) do nothing;
    exception
      when exclusion_violation then
        insert into calendar_sync_conflicts (source_table, source_id, conflict_message)
        values ('appointments', r.id, 'Teacher already booked for an overlapping time range.');
    end;
  end loop;

  for r in select * from makeup_classes where makeup_datetime is not null
  loop
    v_status := case
      when lower(coalesce(r.status, '')) = 'completed' then 'completed'::calendar_event_status
      when lower(coalesce(r.status, '')) in ('cancelled', 'canceled') then 'cancelled'::calendar_event_status
      else 'scheduled'::calendar_event_status
    end;

    begin
      insert into calendar_events (
        event_type, source_table, source_id, title, starts_at, ends_at,
        teacher_id, venue_id, status, academy_id
      ) values (
        'makeup_class', 'makeup_classes', r.id,
        coalesce('Makeup: ' || r.reason, 'Makeup Class'),
        r.makeup_datetime,
        r.makeup_datetime + interval '180 minutes',
        r.teacher_id, null, v_status, r.academy_id
      )
      on conflict (source_table, source_id) do nothing;
    exception
      when exclusion_violation then
        insert into calendar_sync_conflicts (source_table, source_id, conflict_message)
        values ('makeup_classes', r.id, 'Teacher already booked for an overlapping time range.');
    end;
  end loop;

  for r in
    select eo.*, e.title as event_title, e.academy_id as ev_academy_id
    from event_occurrences eo
    join events e on e.id = eo.event_id
    where eo.starts_at is not null and eo.ends_at is not null
  loop
    begin
      insert into calendar_events (
        event_type, source_table, source_id, title, starts_at, ends_at,
        teacher_id, venue_id, status, academy_id
      ) values (
        'public_event', 'event_occurrences', r.id, coalesce(r.event_title, 'Academy Event'),
        r.starts_at, r.ends_at, null, r.venue_id, r.status, r.ev_academy_id
      )
      on conflict (source_table, source_id) do nothing;
    exception
      when exclusion_violation then
        insert into calendar_sync_conflicts (source_table, source_id, conflict_message)
        values ('event_occurrences', r.id, 'Venue already booked for an overlapping time range.');
    end;
  end loop;
end $$;
