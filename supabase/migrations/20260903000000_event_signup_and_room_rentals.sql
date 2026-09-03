-- =====================================================================
-- JEP AMAS — external event signup links + classroom co-working rentals
-- Generated: 2026-09-03
--
-- Two additions:
-- 1. event_occurrences gets a public-signup toggle (separate from the
--    existing logged-in-student "registration_open" self-serve toggle)
--    and a free-text field for a partner-run external registration link.
-- 2. room_rentals is a new schedulable entity (a classroom rented out as
--    external co-working space) that plugs into the same calendar_events
--    sync/exclusion-constraint layer every other schedulable table uses,
--    so a rented room can't be double-booked for a class and vice versa.
-- =====================================================================

-- ---------------------------------------------------------------------
-- event_occurrences: public signup toggle + external link passthrough
-- ---------------------------------------------------------------------
alter table public.event_occurrences
  add column if not exists public_registration_enabled boolean not null default false,
  add column if not exists external_registration_url text;

comment on column public.event_occurrences.public_registration_enabled is
  'Enables the anonymous public signup link (/register/:occurrenceId) served via the public-event-signup Edge Function. Independent of registration_open, which only self-serves logged-in students.';

comment on column public.event_occurrences.external_registration_url is
  'Optional link to a partner-run registration page (e.g. a co-organizing company''s own signup form). Purely informational — registrations made there never touch event_registrations, so they are not tracked or counted against capacity here.';

-- ---------------------------------------------------------------------
-- room_rentals
-- ---------------------------------------------------------------------
create table if not exists public.room_rentals (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id),
  classroom_id uuid not null references public.classrooms(id),
  renter_name text not null,
  renter_contact text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price numeric,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_room_rentals_classroom on public.room_rentals(classroom_id);
create index if not exists idx_room_rentals_starts_at on public.room_rentals(starts_at);

drop trigger if exists trg_room_rentals_updated_at on public.room_rentals;
create trigger trg_room_rentals_updated_at
  before update on public.room_rentals
  for each row execute function public.update_updated_at_column();

drop trigger if exists trg_set_academy_id on public.room_rentals;
create trigger trg_set_academy_id
  before insert on public.room_rentals
  for each row execute function public.set_academy_id_from_session();

alter table public.room_rentals enable row level security;

create policy room_rentals_select on public.room_rentals
  for select using (
    public.in_my_academy(academy_id)
    and public.is_backoffice_staff()
  );

create policy room_rentals_manage on public.room_rentals
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

comment on table public.room_rentals is
  'Classrooms rented out as external co-working space. Synced into calendar_events (event_type external_service) so the existing venue exclusion constraint blocks double-booking against classes/makeups/other events, and so it shows on the Unified Calendar and Classroom Allocation.';

-- ---------------------------------------------------------------------
-- room_rentals -> calendar_events (same pattern as
-- 20260902140000_calendar_events_sync.sql's other four tables)
-- ---------------------------------------------------------------------
create or replace function public.sync_room_rental_to_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status calendar_event_status;
begin
  if TG_OP = 'DELETE' then
    delete from calendar_events where source_table = 'room_rentals' and source_id = old.id;
    return old;
  end if;

  v_status := case
    when new.status = 'completed' then 'completed'::calendar_event_status
    when new.status = 'cancelled' then 'cancelled'::calendar_event_status
    else 'scheduled'::calendar_event_status
  end;

  begin
    insert into calendar_events (
      event_type, source_table, source_id, title, starts_at, ends_at,
      teacher_id, venue_id, status, academy_id
    ) values (
      'external_service', 'room_rentals', new.id,
      'Room Rental: ' || new.renter_name,
      new.starts_at, new.ends_at, null, new.classroom_id, v_status, new.academy_id
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
      raise exception 'Scheduling conflict: this room is already booked for another session at that time.'
        using errcode = '23P01';
  end;

  return new;
end;
$$;

drop trigger if exists trg_sync_room_rental_to_calendar_event on public.room_rentals;
create trigger trg_sync_room_rental_to_calendar_event
  after insert or update or delete on public.room_rentals
  for each row execute function public.sync_room_rental_to_calendar_event();
