-- =====================================================================
-- JEP AMAS — backfill academy_id + dedupe academies
-- Generated: 2026-09-02
--
-- Discovered while re-testing the RLS rollout: every row in every
-- academy-scoped table has academy_id = NULL (including users itself),
-- and the academies table has two identical "JEP Image Makeup Academy"
-- rows with nothing pointing at either of them. Since current_academy_id()
-- reads academy_id off the caller's own users row, a null academy_id
-- means in_my_academy() can never be true for anyone but super_admin —
-- the RLS policies applied in 20260902130000_rls_policies.sql would
-- otherwise leave every other role staring at empty screens.
--
-- Fix: backfill every null academy_id to the earlier (canonical) academy
-- row, then remove the now-confirmed-unused duplicate.
-- =====================================================================

do $$
declare
  canonical_academy_id uuid := '951c9a25-2e64-4e10-adf9-ff387afaece3';
begin
  update appointments set academy_id = canonical_academy_id where academy_id is null;
  update attendance set academy_id = canonical_academy_id where academy_id is null;
  update audit_logs set academy_id = canonical_academy_id where academy_id is null;
  update certificates set academy_id = canonical_academy_id where academy_id is null;
  update class_batches set academy_id = canonical_academy_id where academy_id is null;
  update classrooms set academy_id = canonical_academy_id where academy_id is null;
  update course_categories set academy_id = canonical_academy_id where academy_id is null;
  update courses set academy_id = canonical_academy_id where academy_id is null;
  update documents set academy_id = canonical_academy_id where academy_id is null;
  update enrollments set academy_id = canonical_academy_id where academy_id is null;
  update installments set academy_id = canonical_academy_id where academy_id is null;
  update lessons set academy_id = canonical_academy_id where academy_id is null;
  update makeup_classes set academy_id = canonical_academy_id where academy_id is null;
  update notifications set academy_id = canonical_academy_id where academy_id is null;
  update payment_plans set academy_id = canonical_academy_id where academy_id is null;
  update payments set academy_id = canonical_academy_id where academy_id is null;
  update portfolio_feedback set academy_id = canonical_academy_id where academy_id is null;
  update portfolio_items set academy_id = canonical_academy_id where academy_id is null;
  update receipts set academy_id = canonical_academy_id where academy_id is null;
  update registration_applications set academy_id = canonical_academy_id where academy_id is null;
  update students set academy_id = canonical_academy_id where academy_id is null;
  update surveys set academy_id = canonical_academy_id where academy_id is null;
  update teacher_availability set academy_id = canonical_academy_id where academy_id is null;
  update teachers set academy_id = canonical_academy_id where academy_id is null;
  update users set academy_id = canonical_academy_id where academy_id is null;
end $$;

-- The duplicate academy row has zero rows referencing it (confirmed via
-- the null-count audit above) — safe to remove.
delete from academies where id = '5bc0a995-5305-4532-b9a2-2862313a50ce';
