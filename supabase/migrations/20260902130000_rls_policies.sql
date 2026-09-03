-- =====================================================================
-- JEP AMAS — Row Level Security policy rollout
-- Generated: 2026-09-02
--
-- Scope:
--   1. Harden existing helper functions (fix mutable search_path warning)
--   2. Add current_teacher_id() / current_student_id() + role-group helpers
--   3. Add academy_id to calendar_events / events / service_bookings
--      (they were created with 0 rows in the prior migration, so this is
--      a free, safe fix rather than a backfill problem) so every table in
--      the schema can be scoped to a tenant academy
--   4. Enable RLS + policies on every table that was either fully
--      unprotected (RLS disabled) or RLS-enabled-with-zero-policies
--      (effectively locked out). Tables that already carry working
--      policies (crm_*, sales_targets, generated_reports, notifications,
--      portfolio_feedback, user_invitations) are left untouched, except
--      crm_reminders which had RLS on with zero policies (a lock-out bug)
--      and is fixed to match its sibling crm_* tables.
--   5. Relocate btree_gist out of the public schema
--
-- Role model mirrors src/app/utils/permissions.ts exactly:
--   super_admin (bypasses all scoping), admin, owner, teacher,
--   assistant_teacher, student, finance, internal_sales, external_sales,
--   parent
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extension relocation
-- ---------------------------------------------------------------------
create schema if not exists extensions;
alter extension btree_gist set schema extensions;

-- ---------------------------------------------------------------------
-- 1. Harden pre-existing helper functions (search_path fix)
-- ---------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid()
$$;

create or replace function public.current_academy_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select academy_id from users where auth_user_id = auth.uid()
$$;

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where auth_user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- 2. New helper functions
-- ---------------------------------------------------------------------
create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from teachers where user_id = public.current_app_user_id()
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from students where user_id = public.current_app_user_id()
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'super_admin', false)
$$;

create or replace function public.is_academy_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('super_admin', 'admin'), false)
$$;

create or replace function public.is_academy_leadership()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('super_admin', 'admin', 'owner'), false)
$$;

create or replace function public.is_backoffice_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in
    ('super_admin', 'admin', 'owner', 'finance', 'internal_sales', 'external_sales'), false)
$$;

create or replace function public.is_teaching_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('teacher', 'assistant_teacher'), false)
$$;

create or replace function public.in_my_academy(target_academy uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or target_academy = public.current_academy_id()
$$;

comment on function public.current_teacher_id() is 'RLS helper: teachers.id for the calling user, if they are a teacher.';
comment on function public.current_student_id() is 'RLS helper: students.id for the calling user, if they are a student.';
comment on function public.in_my_academy(uuid) is 'RLS helper: true if target academy matches the caller academy, or the caller is super_admin.';

-- ---------------------------------------------------------------------
-- 3. Close the multi-tenant scoping gap on the calendar-centric tables
--    added in 20260902120000_calendar_centric_foundation.sql (0 rows,
--    safe to alter).
-- ---------------------------------------------------------------------
alter table public.calendar_events add column if not exists academy_id uuid references public.academies(id);
alter table public.calendar_events alter column academy_id set not null;
create index if not exists idx_calendar_events_academy_id on public.calendar_events(academy_id);

alter table public.events add column if not exists academy_id uuid references public.academies(id);
alter table public.events alter column academy_id set not null;
create index if not exists idx_events_academy_id on public.events(academy_id);

alter table public.service_bookings add column if not exists academy_id uuid references public.academies(id);
alter table public.service_bookings alter column academy_id set not null;
create index if not exists idx_service_bookings_academy_id on public.service_bookings(academy_id);

-- =====================================================================
-- 4. RLS policies
-- =====================================================================

-- ---------- academies ----------
alter table public.academies enable row level security;

create policy academies_select on public.academies
  for select using (public.in_my_academy(id));

create policy academies_manage on public.academies
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

create policy academies_update_own on public.academies
  for update using (public.is_academy_leadership() and public.in_my_academy(id))
  with check (public.in_my_academy(id));

-- ---------- campuses ----------
alter table public.campuses enable row level security;

create policy campuses_select on public.campuses
  for select using (public.in_my_academy(academy_id));

create policy campuses_manage on public.campuses
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- users ----------
-- Note: users.password is a legacy text column — SELECT is deliberately
-- NOT opened up academy-wide (unlike most catalog tables) to avoid
-- leaking it to every role. See summary notes to the user.
alter table public.users enable row level security;

create policy users_select_self on public.users
  for select using (auth_user_id = auth.uid());

create policy users_select_backoffice on public.users
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy users_manage on public.users
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy users_update_self on public.users
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- ---------- course_categories ----------
alter table public.course_categories enable row level security;

create policy course_categories_select on public.course_categories
  for select using (public.in_my_academy(academy_id));

create policy course_categories_manage on public.course_categories
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- courses ----------
alter table public.courses enable row level security;

create policy courses_select on public.courses
  for select using (public.in_my_academy(academy_id));

create policy courses_manage on public.courses
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- course_modules ----------
alter table public.course_modules enable row level security;

create policy course_modules_select on public.course_modules
  for select using (exists (
    select 1 from public.courses c
    where c.id = course_modules.course_id and public.in_my_academy(c.academy_id)
  ));

create policy course_modules_manage on public.course_modules
  for all using (public.is_academy_admin() and exists (
    select 1 from public.courses c
    where c.id = course_modules.course_id and public.in_my_academy(c.academy_id)
  ))
  with check (exists (
    select 1 from public.courses c
    where c.id = course_modules.course_id and public.in_my_academy(c.academy_id)
  ));

-- ---------- course_module_prerequisites ----------
alter table public.course_module_prerequisites enable row level security;

create policy course_module_prerequisites_select on public.course_module_prerequisites
  for select using (exists (
    select 1 from public.course_modules m join public.courses c on c.id = m.course_id
    where m.id = course_module_prerequisites.module_id and public.in_my_academy(c.academy_id)
  ));

create policy course_module_prerequisites_manage on public.course_module_prerequisites
  for all using (public.is_academy_admin() and exists (
    select 1 from public.course_modules m join public.courses c on c.id = m.course_id
    where m.id = course_module_prerequisites.module_id and public.in_my_academy(c.academy_id)
  ))
  with check (exists (
    select 1 from public.course_modules m join public.courses c on c.id = m.course_id
    where m.id = course_module_prerequisites.module_id and public.in_my_academy(c.academy_id)
  ));

-- ---------- classrooms ----------
alter table public.classrooms enable row level security;

create policy classrooms_select on public.classrooms
  for select using (public.in_my_academy(academy_id));

create policy classrooms_manage on public.classrooms
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- class_batches ----------
alter table public.class_batches enable row level security;

create policy class_batches_select on public.class_batches
  for select using (public.in_my_academy(academy_id));

create policy class_batches_manage on public.class_batches
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- lessons ----------
alter table public.lessons enable row level security;

create policy lessons_select on public.lessons
  for select using (public.in_my_academy(academy_id));

create policy lessons_manage on public.lessons
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy lessons_teacher_update on public.lessons
  for update using (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id())
  with check (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id());

-- ---------- teacher_availability ----------
alter table public.teacher_availability enable row level security;

create policy teacher_availability_select on public.teacher_availability
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy teacher_availability_manage_admin on public.teacher_availability
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy teacher_availability_manage_own on public.teacher_availability
  for all using (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id())
  with check (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id());

-- ---------- registration_applications ----------
alter table public.registration_applications enable row level security;

create policy registration_applications_select_staff on public.registration_applications
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy registration_applications_select_self on public.registration_applications
  for select using (student_id = public.current_student_id());

create policy registration_applications_manage on public.registration_applications
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy registration_applications_insert_self on public.registration_applications
  for insert with check (student_id = public.current_student_id() and public.in_my_academy(academy_id));

-- ---------- enrollments ----------
alter table public.enrollments enable row level security;

create policy enrollments_select_staff on public.enrollments
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy enrollments_select_self on public.enrollments
  for select using (
    student_id = public.current_student_id()
    or exists (select 1 from public.students s where s.id = enrollments.student_id and s.parent_user_id = public.current_app_user_id())
  );

create policy enrollments_manage on public.enrollments
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- student_module_progress ----------
alter table public.student_module_progress enable row level security;

create policy student_module_progress_select_staff on public.student_module_progress
  for select using (exists (
    select 1 from public.enrollments e
    where e.id = student_module_progress.enrollment_id
      and public.in_my_academy(e.academy_id)
      and (public.is_backoffice_staff() or public.is_teaching_staff())
  ));

create policy student_module_progress_select_self on public.student_module_progress
  for select using (exists (
    select 1 from public.enrollments e
    where e.id = student_module_progress.enrollment_id and e.student_id = public.current_student_id()
  ));

create policy student_module_progress_manage on public.student_module_progress
  for all using (exists (
    select 1 from public.enrollments e
    where e.id = student_module_progress.enrollment_id
      and public.in_my_academy(e.academy_id)
      and (public.is_academy_admin() or public.is_teaching_staff())
  ))
  with check (exists (
    select 1 from public.enrollments e
    where e.id = student_module_progress.enrollment_id and public.in_my_academy(e.academy_id)
  ));

-- ---------- makeup_classes ----------
alter table public.makeup_classes enable row level security;

create policy makeup_classes_select_staff on public.makeup_classes
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy makeup_classes_select_self on public.makeup_classes
  for select using (student_id = public.current_student_id());

create policy makeup_classes_manage_admin on public.makeup_classes
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy makeup_classes_manage_own on public.makeup_classes
  for all using (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id())
  with check (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id());

-- ---------- attendance ----------
alter table public.attendance enable row level security;

create policy attendance_select_staff on public.attendance
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy attendance_select_self on public.attendance
  for select using (
    student_id = public.current_student_id()
    or exists (select 1 from public.students s where s.id = attendance.student_id and s.parent_user_id = public.current_app_user_id())
  );

create policy attendance_manage_admin on public.attendance
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy attendance_manage_teacher on public.attendance
  for all using (
    public.in_my_academy(academy_id)
    and exists (select 1 from public.lessons l where l.id = attendance.lesson_id and l.teacher_id = public.current_teacher_id())
  )
  with check (
    public.in_my_academy(academy_id)
    and exists (select 1 from public.lessons l where l.id = attendance.lesson_id and l.teacher_id = public.current_teacher_id())
  );

-- ---------- appointments ----------
alter table public.appointments enable row level security;

create policy appointments_select_staff on public.appointments
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy appointments_select_self on public.appointments
  for select using (
    student_id = public.current_student_id()
    or teacher_id = public.current_teacher_id()
  );

create policy appointments_manage_admin on public.appointments
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy appointments_manage_teacher on public.appointments
  for update using (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id())
  with check (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id());

create policy appointments_insert_self on public.appointments
  for insert with check (student_id = public.current_student_id() and public.in_my_academy(academy_id));

-- ---------- leave_requests ----------
alter table public.leave_requests enable row level security;

create policy leave_requests_select_staff on public.leave_requests
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy leave_requests_select_self on public.leave_requests
  for select using (student_id = public.current_student_id());

create policy leave_requests_insert_self on public.leave_requests
  for insert with check (student_id = public.current_student_id() and public.in_my_academy(academy_id));

create policy leave_requests_review on public.leave_requests
  for update using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.is_teaching_staff())
  )
  with check (public.in_my_academy(academy_id));

create policy leave_requests_manage_admin on public.leave_requests
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- payment_plans ----------
alter table public.payment_plans enable row level security;

create policy payment_plans_select_staff on public.payment_plans
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy payment_plans_select_self on public.payment_plans
  for select using (student_id = public.current_student_id());

create policy payment_plans_manage on public.payment_plans
  for all using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.current_user_role() = 'finance')
  )
  with check (public.in_my_academy(academy_id));

-- ---------- installments ----------
alter table public.installments enable row level security;

create policy installments_select_staff on public.installments
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy installments_select_self on public.installments
  for select using (exists (
    select 1 from public.payment_plans pp
    where pp.id = installments.payment_plan_id and pp.student_id = public.current_student_id()
  ));

create policy installments_manage on public.installments
  for all using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.current_user_role() = 'finance')
  )
  with check (public.in_my_academy(academy_id));

-- ---------- payments ----------
alter table public.payments enable row level security;

create policy payments_select_staff on public.payments
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy payments_select_self on public.payments
  for select using (student_id = public.current_student_id());

create policy payments_manage on public.payments
  for all using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.current_user_role() = 'finance')
  )
  with check (public.in_my_academy(academy_id));

-- ---------- receipts ----------
alter table public.receipts enable row level security;

create policy receipts_select_staff on public.receipts
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy receipts_select_self on public.receipts
  for select using (exists (
    select 1 from public.payments p
    where p.id = receipts.payment_id and p.student_id = public.current_student_id()
  ));

create policy receipts_manage on public.receipts
  for all using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.current_user_role() = 'finance')
  )
  with check (public.in_my_academy(academy_id));

-- ---------- discounts ----------
alter table public.discounts enable row level security;

create policy discounts_select on public.discounts
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy discounts_manage on public.discounts
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- portfolio_items ----------
alter table public.portfolio_items enable row level security;

create policy portfolio_items_select_staff on public.portfolio_items
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy portfolio_items_select_self on public.portfolio_items
  for select using (
    student_id = public.current_student_id()
    or exists (select 1 from public.students s where s.id = portfolio_items.student_id and s.parent_user_id = public.current_app_user_id())
  );

create policy portfolio_items_manage_staff on public.portfolio_items
  for all using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.is_teaching_staff())
  )
  with check (public.in_my_academy(academy_id));

create policy portfolio_items_insert_self on public.portfolio_items
  for insert with check (student_id = public.current_student_id() and public.in_my_academy(academy_id));

-- ---------- featured_works ----------
alter table public.featured_works enable row level security;

create policy featured_works_select on public.featured_works
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy featured_works_manage on public.featured_works
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- certificates ----------
alter table public.certificates enable row level security;

create policy certificates_select_staff on public.certificates
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy certificates_select_self on public.certificates
  for select using (
    student_id = public.current_student_id()
    or exists (select 1 from public.students s where s.id = certificates.student_id and s.parent_user_id = public.current_app_user_id())
  );

create policy certificates_manage on public.certificates
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- message_templates ----------
alter table public.message_templates enable row level security;

create policy message_templates_select on public.message_templates
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy message_templates_manage on public.message_templates
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- documents ----------
alter table public.documents enable row level security;

create policy documents_select_staff on public.documents
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy documents_select_self on public.documents
  for select using (student_id = public.current_student_id());

create policy documents_manage_staff on public.documents
  for all using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.is_teaching_staff())
  )
  with check (public.in_my_academy(academy_id));

create policy documents_insert_self on public.documents
  for insert with check (student_id = public.current_student_id() and public.in_my_academy(academy_id));

-- ---------- surveys ----------
-- Business rule: teachers must NOT see satisfaction ratings.
alter table public.surveys enable row level security;

create policy surveys_select_leadership on public.surveys
  for select using (public.is_academy_leadership() and public.in_my_academy(academy_id));

create policy surveys_select_self on public.surveys
  for select using (student_id = public.current_student_id());

create policy surveys_insert_self on public.surveys
  for insert with check (student_id = public.current_student_id() and public.in_my_academy(academy_id));

create policy surveys_manage_admin on public.surveys
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- audit_logs ----------
alter table public.audit_logs enable row level security;

create policy audit_logs_select on public.audit_logs
  for select using (public.is_academy_leadership() and public.in_my_academy(academy_id));

create policy audit_logs_insert on public.audit_logs
  for insert with check (user_id = public.current_app_user_id() and public.in_my_academy(academy_id));

create policy audit_logs_manage_super_admin on public.audit_logs
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------- pdpa_consents ----------
alter table public.pdpa_consents enable row level security;

create policy pdpa_consents_select_self on public.pdpa_consents
  for select using (user_id = public.current_app_user_id());

create policy pdpa_consents_select_staff on public.pdpa_consents
  for select using (
    public.is_academy_leadership()
    and exists (select 1 from public.users u where u.id = pdpa_consents.user_id and public.in_my_academy(u.academy_id))
  );

create policy pdpa_consents_insert_self on public.pdpa_consents
  for insert with check (user_id = public.current_app_user_id());

-- ---------- data_requests ----------
alter table public.data_requests enable row level security;

create policy data_requests_select_self on public.data_requests
  for select using (user_id = public.current_app_user_id());

create policy data_requests_select_staff on public.data_requests
  for select using (
    public.is_academy_leadership()
    and exists (select 1 from public.users u where u.id = data_requests.user_id and public.in_my_academy(u.academy_id))
  );

create policy data_requests_insert_self on public.data_requests
  for insert with check (user_id = public.current_app_user_id());

create policy data_requests_resolve_staff on public.data_requests
  for update using (
    public.is_academy_leadership()
    and exists (select 1 from public.users u where u.id = data_requests.user_id and public.in_my_academy(u.academy_id))
  )
  with check (true);

-- ---------- referral_rewards ----------
alter table public.referral_rewards enable row level security;

create policy referral_rewards_select_staff on public.referral_rewards
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy referral_rewards_select_self on public.referral_rewards
  for select using (
    referrer_student_id = public.current_student_id()
    or referred_student_id = public.current_student_id()
  );

create policy referral_rewards_manage on public.referral_rewards
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- procurement_items ----------
alter table public.procurement_items enable row level security;

create policy procurement_items_select on public.procurement_items
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy procurement_items_manage on public.procurement_items
  for all using (
    public.in_my_academy(academy_id)
    and (public.is_academy_admin() or public.is_teaching_staff())
  )
  with check (public.in_my_academy(academy_id));

-- ---------- calendar_events ----------
alter table public.calendar_events enable row level security;

create policy calendar_events_select on public.calendar_events
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy calendar_events_select_teacher_own on public.calendar_events
  for select using (teacher_id = public.current_teacher_id());

create policy calendar_events_manage on public.calendar_events
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy calendar_events_manage_teacher on public.calendar_events
  for update using (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id())
  with check (public.in_my_academy(academy_id) and teacher_id = public.current_teacher_id());

-- ---------- events ----------
alter table public.events enable row level security;

create policy events_select on public.events
  for select using (public.in_my_academy(academy_id));

create policy events_manage on public.events
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- event_occurrences ----------
alter table public.event_occurrences enable row level security;

create policy event_occurrences_select on public.event_occurrences
  for select using (exists (
    select 1 from public.events ev where ev.id = event_occurrences.event_id and public.in_my_academy(ev.academy_id)
  ));

create policy event_occurrences_manage on public.event_occurrences
  for all using (public.is_academy_admin() and exists (
    select 1 from public.events ev where ev.id = event_occurrences.event_id and public.in_my_academy(ev.academy_id)
  ))
  with check (exists (
    select 1 from public.events ev where ev.id = event_occurrences.event_id and public.in_my_academy(ev.academy_id)
  ));

-- ---------- event_registrations ----------
alter table public.event_registrations enable row level security;

create policy event_registrations_select_staff on public.event_registrations
  for select using (exists (
    select 1 from public.event_occurrences occ join public.events ev on ev.id = occ.event_id
    where occ.id = event_registrations.occurrence_id
      and public.in_my_academy(ev.academy_id)
      and public.is_backoffice_staff()
  ));

create policy event_registrations_select_self on public.event_registrations
  for select using (student_id = public.current_student_id());

create policy event_registrations_manage on public.event_registrations
  for all using (public.is_academy_admin() and exists (
    select 1 from public.event_occurrences occ join public.events ev on ev.id = occ.event_id
    where occ.id = event_registrations.occurrence_id and public.in_my_academy(ev.academy_id)
  ))
  with check (exists (
    select 1 from public.event_occurrences occ join public.events ev on ev.id = occ.event_id
    where occ.id = event_registrations.occurrence_id and public.in_my_academy(ev.academy_id)
  ));

create policy event_registrations_insert_self on public.event_registrations
  for insert with check (student_id = public.current_student_id());

-- ---------- reschedule_requests ----------
alter table public.reschedule_requests enable row level security;

create policy reschedule_requests_select_staff on public.reschedule_requests
  for select using (exists (
    select 1 from public.calendar_events ce
    where ce.id = reschedule_requests.calendar_event_id
      and public.in_my_academy(ce.academy_id)
      and (public.is_backoffice_staff() or public.is_teaching_staff())
  ));

create policy reschedule_requests_select_self on public.reschedule_requests
  for select using (student_id = public.current_student_id());

create policy reschedule_requests_insert_self on public.reschedule_requests
  for insert with check (student_id = public.current_student_id());

create policy reschedule_requests_review on public.reschedule_requests
  for update using (exists (
    select 1 from public.calendar_events ce
    where ce.id = reschedule_requests.calendar_event_id
      and public.in_my_academy(ce.academy_id)
      and (public.is_academy_admin() or public.is_teaching_staff())
  ))
  with check (true);

-- ---------- service_bookings ----------
-- Staff-entered revenue log (client self-booking flow was deliberately
-- removed — admin/teacher record completed services here).
alter table public.service_bookings enable row level security;

create policy service_bookings_select_staff on public.service_bookings
  for select using (public.is_backoffice_staff() and public.in_my_academy(academy_id));

create policy service_bookings_select_own on public.service_bookings
  for select using (public.in_my_academy(academy_id) and staff_id = public.current_teacher_id());

create policy service_bookings_manage_admin on public.service_bookings
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy service_bookings_manage_own on public.service_bookings
  for all using (public.in_my_academy(academy_id) and staff_id = public.current_teacher_id())
  with check (public.in_my_academy(academy_id) and staff_id = public.current_teacher_id());

-- ---------- students ----------
alter table public.students enable row level security;

create policy students_select_staff on public.students
  for select using (
    public.in_my_academy(academy_id)
    and (public.is_backoffice_staff() or public.is_teaching_staff())
  );

create policy students_select_self on public.students
  for select using (user_id = public.current_app_user_id() or parent_user_id = public.current_app_user_id());

create policy students_manage on public.students
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

create policy students_update_self on public.students
  for update using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

-- ---------- teachers ----------
alter table public.teachers enable row level security;

create policy teachers_select on public.teachers
  for select using (public.in_my_academy(academy_id));

create policy teachers_select_self on public.teachers
  for select using (user_id = public.current_app_user_id());

create policy teachers_manage on public.teachers
  for all using (public.is_academy_admin() and public.in_my_academy(academy_id))
  with check (public.in_my_academy(academy_id));

-- ---------- crm_reminders (bug fix: RLS was ON with zero policies) ----------
-- Matches the coarse "authenticated can manage" convention already used
-- by its sibling crm_* tables (crm_leads, crm_deals, crm_followups, ...).
create policy crm_reminders_access on public.crm_reminders
  for all using (true) with check (true);
