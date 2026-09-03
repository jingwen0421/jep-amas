-- =====================================================================
-- JEP AMAS — allow academy admins/leadership to dismiss logged
-- calendar sync conflicts once they've been manually resolved.
-- Generated: 2026-09-02
-- =====================================================================

create policy calendar_sync_conflicts_dismiss on public.calendar_sync_conflicts
  for delete using (public.is_academy_admin());
