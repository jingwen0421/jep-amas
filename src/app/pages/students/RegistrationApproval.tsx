import { useEffect, useState } from 'react';
import {
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Edit,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  notifyStudentRegistrationApproved,
  notifyStudentRegistrationRejected,
} from '../../services/systemNotificationService';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmDialogContext';

interface PendingRegistration {
  id: string;
  applicationId: string;
  studentDbId: string;
  courseId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  appliedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'More Info Required';
  icPassport: string;
  emergencyContact: string;
  icDocumentUrl: string;
  signatureUrl: string;
}

interface CourseOption {
  id: string;
  course_name: string;
}

export default function RegistrationApproval() {
  const { t } = useLanguage();
  const confirmDialog = useConfirm();
  const [selectedApplication, setSelectedApplication] =
    useState<PendingRegistration | null>(null);

  const [editingApplication, setEditingApplication] =
    useState<PendingRegistration | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    icPassport: '',
    emergencyContact: '',
    courseId: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const [applications, setApplications] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_name')
      .order('course_name', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error.message);
      return;
    }

    setCourses(data || []);
  }

  function openEditModal(application: PendingRegistration) {
    setEditingApplication(application);
    setEditForm({
      fullName: application.name,
      email: application.email === '-' ? '' : application.email,
      phone: application.phone === '-' ? '' : application.phone,
      icPassport:
        application.icPassport === '-' ? '' : application.icPassport,
      emergencyContact:
        application.emergencyContact === '-'
          ? ''
          : application.emergencyContact,
      courseId: application.courseId,
    });
  }

  async function saveEdit() {
    if (!editingApplication) return;

    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      alert(t('students.approval.error.fillNameEmail'));
      return;
    }

    setSavingEdit(true);

    const { error: studentError } = await supabase
      .from('students')
      .update({
        full_name: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        ic_passport: editForm.icPassport.trim(),
        emergency_contact_phone: editForm.emergencyContact.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingApplication.studentDbId);

    if (studentError) {
      alert(t('students.approval.error.saveFailed', { error: studentError.message }));
      setSavingEdit(false);
      return;
    }

    const { error: appError } = await supabase
      .from('registration_applications')
      .update({ course_id: editForm.courseId })
      .eq('id', editingApplication.applicationId);

    if (appError) {
      alert(t('students.approval.error.courseUpdateFailed', { error: appError.message }));
      setSavingEdit(false);
      return;
    }

    await createAuditLog(
      'Edited Registration',
      'Student Management',
      editingApplication.studentDbId,
      {
        student_name: editForm.fullName.trim(),
        email: editForm.email.trim(),
      }
    );

    setSavingEdit(false);
    setEditingApplication(null);
    fetchApplications();
  }

  async function fetchApplications() {
    setLoading(true);

    const { data, error } = await supabase
      .from('registration_applications')
      .select(`
        id,
        student_id,
        course_id,
        application_status,
        submitted_at,
        students(
          id,
          student_code,
          full_name,
          email,
          phone,
          ic_passport,
          emergency_contact_phone,
          ic_document_url,
          signature_url
        ),
        courses(course_name)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error.message);
      setLoading(false);
      return;
    }

    const mapped: PendingRegistration[] = (data || []).map((app: any) => {
      const student = getSingle(app.students);
      const course = getSingle(app.courses);

      return {
        id: student?.student_code || app.id,
        applicationId: app.id,
        studentDbId: student?.id || app.student_id,
        courseId: app.course_id,
        name: student?.full_name || t('students.approval.fallback.unnamedStudent'),
        email: student?.email || '-',
        phone: student?.phone || '-',
        course: course?.course_name || '-',
        appliedDate: app.submitted_at
          ? new Date(app.submitted_at).toISOString().slice(0, 10)
          : '-',
        status: formatApplicationStatus(app.application_status),
        icPassport: student?.ic_passport || '-',
        emergencyContact: student?.emergency_contact_phone || '-',
        icDocumentUrl: student?.ic_document_url || '',
        signatureUrl: student?.signature_url || '',
      };
    });

    setApplications(mapped);
    setLoading(false);
  }

  async function approveApplication(application: PendingRegistration) {
    const confirmed = await confirmDialog(
      t('students.approval.confirm.approve', { name: application.name })
    );
    if (!confirmed) return;

    const userId = await getUserIdByEmail(application.email);

    const { error: appError } = await supabase
      .from('registration_applications')
      .update({
        application_status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application.applicationId);

    if (appError) {
      alert(t('students.approval.error.approveFailed', { error: appError.message }));
      return;
    }

    const { error: studentError } = await supabase
      .from('students')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.studentDbId);

    if (studentError) {
      alert(
        t('students.approval.error.activateStudentFailed', { error: studentError.message })
      );
      return;
    }

    if (userId) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userError) {
        alert(
          t('students.approval.error.activateLoginFailed', { error: userError.message })
        );
        return;
      }
    }

    const enrollmentId = await createEnrollmentIfPossible(application);

    if (enrollmentId) {
      await createPaymentPlanIfPossible(application, enrollmentId);
    }

    await notifyStudentRegistrationApproved(application.name, {
      userId,
    });

    await createAuditLog(
      'Approved Registration',
      'Student Management',
      application.studentDbId,
      {
        student_name: application.name,
        course: application.course,
        user_id: userId || null,
        user_status: userId ? 'active' : 'not_found',
      }
    );

    setSelectedApplication(null);
    fetchApplications();
  }

  async function rejectApplication(application: PendingRegistration) {
    const confirmed = await confirmDialog(
      t('students.approval.confirm.reject', { name: application.name }),
      { variant: 'danger' }
    );
    if (!confirmed) return;

    const userId = await getUserIdByEmail(application.email);

    const { error: appError } = await supabase
      .from('registration_applications')
      .update({
        application_status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application.applicationId);

    if (appError) {
      alert(t('students.approval.error.rejectFailed', { error: appError.message }));
      return;
    }

    const { error: studentError } = await supabase
      .from('students')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.studentDbId);

    if (studentError) {
      alert(
        t('students.approval.error.rejectStudentUpdateFailed', { error: studentError.message })
      );
      return;
    }

    if (userId) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userError) {
        alert(
          t('students.approval.error.rejectLoginFailed', { error: userError.message })
        );
        return;
      }
    }

    await notifyStudentRegistrationRejected(application.name, {
      userId,
    });

    await createAuditLog(
      'Rejected Registration',
      'Student Management',
      application.studentDbId,
      {
        student_name: application.name,
        course: application.course,
        user_id: userId || null,
        user_status: userId ? 'rejected' : 'not_found',
      }
    );

    setSelectedApplication(null);
    fetchApplications();
  }

  async function requestMoreInfo(application: PendingRegistration) {
    const confirmed = await confirmDialog(
      t('students.approval.confirm.moreInfo', { name: application.name })
    );
    if (!confirmed) return;

    const userId = await getUserIdByEmail(application.email);

    const { error } = await supabase
      .from('registration_applications')
      .update({
        application_status: 'more_info_required',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application.applicationId);

    if (error) {
      alert(t('students.approval.error.moreInfoFailed', { error: error.message }));
      return;
    }

    if (userId) {
      await supabase
        .from('users')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    await createAuditLog(
      'Requested More Info',
      'Student Management',
      application.studentDbId,
      {
        student_name: application.name,
        course: application.course,
        user_id: userId || null,
      }
    );

    setSelectedApplication(null);
    fetchApplications();
  }

  async function createEnrollmentIfPossible(application: PendingRegistration) {
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', application.studentDbId)
      .eq('enrollment_status', 'active')
      .maybeSingle();

    if (existingEnrollment) {
      return existingEnrollment.id;
    }

    const { data: batch, error: batchError } = await supabase
      .from('class_batches')
      .select('id')
      .eq('course_id', application.courseId)
      .limit(1)
      .maybeSingle();

    if (batchError) {
      console.error('Failed to fetch class batch:', batchError.message);
      return '';
    }

    if (!batch) {
      alert(t('students.approval.error.noBatchFound'));
      return '';
    }

    const { data: createdEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        student_id: application.studentDbId,
        batch_id: batch.id,
        enrollment_status: 'active',
        enrolled_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (enrollmentError) {
      alert(t('students.approval.error.enrollmentCreateFailed', { error: enrollmentError.message }));
      return '';
    }

    return createdEnrollment.id;
  }

  async function createPaymentPlanIfPossible(
    application: PendingRegistration,
    enrollmentId: string
  ) {
    const { data: existingPlan } = await supabase
      .from('payment_plans')
      .select('id')
      .eq('student_id', application.studentDbId)
      .eq('enrollment_id', enrollmentId)
      .maybeSingle();

    if (existingPlan) return;

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('course_fee')
      .eq('id', application.courseId)
      .maybeSingle();

    if (courseError) {
      console.error('Failed to fetch course fee:', courseError.message);
      return;
    }

    const totalFee = Number(course?.course_fee || 0);

    if (!totalFee || totalFee <= 0) {
      alert(t('students.approval.error.feeMissing'));
      return;
    }

    const { data: createdPlan, error: planError } = await supabase
      .from('payment_plans')
      .insert({
        student_id: application.studentDbId,
        enrollment_id: enrollmentId,
        original_fee: totalFee,
        discount_amount: 0,
        final_amount: totalFee,
        plan_type: 'full_payment',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (planError) {
      alert(
        t('students.approval.error.planCreateFailed', { error: planError.message })
      );
      return;
    }

    const { error: installmentError } = await supabase
      .from('installments')
      .insert({
        payment_plan_id: createdPlan.id,
        amount: totalFee,
        due_date: new Date().toISOString().slice(0, 10),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (installmentError) {
      alert(
        t('students.approval.error.installmentCreateFailed', { error: installmentError.message })
      );
      return;
    }

    await createAuditLog(
      'Payment Plan Auto Created',
      'Payments',
      createdPlan.id,
      {
        student_name: application.name,
        course: application.course,
        total_fee: totalFee,
        plan_type: 'full_payment',
        installment_count: 1,
      }
    );
  }

  async function getUserIdByEmail(email: string) {
    if (!email || email === '-') return '';

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) return '';

    return data.id;
  }

  async function createAuditLog(
    action: string,
    module: string,
    targetId: string,
    newData: Record<string, any>
  ) {
    await supabase.from('audit_logs').insert({
      user_id: null,
      action,
      module,
      target_id: targetId,
      old_data: null,
      new_data: newData,
      created_at: new Date().toISOString(),
    });
  }

  const pendingApplications = applications.filter(
    (app) => app.status === 'Pending'
  );

  const approvedCount = applications.filter(
    (app) => app.status === 'Approved'
  ).length;

  const rejectedCount = applications.filter(
    (app) => app.status === 'Rejected'
  ).length;

  const moreInfoCount = applications.filter(
    (app) => app.status === 'More Info Required'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('students.approval.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {t('students.approval.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          label={t('students.approval.summary.pendingReview')}
          value={pendingApplications.length}
          color="text-yellow-700"
          icon={<AlertCircle size={24} className="text-yellow-700" />}
        />

        <SummaryCard
          label={t('students.approval.summary.approved')}
          value={approvedCount}
          color="text-green-700"
        />

        <SummaryCard
          label={t('students.approval.summary.rejected')}
          value={rejectedCount}
          color="text-red-700"
        />

        <SummaryCard
          label={t('students.approval.summary.moreInfo')}
          value={moreInfoCount}
          color="text-blue-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('students.approval.pendingApplications')}</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('students.approval.loading')}
            </div>
          )}

          {!loading && pendingApplications.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('students.approval.empty')}
            </div>
          )}

          {!loading &&
            pendingApplications.map((application) => (
              <ApplicationCard
                key={application.applicationId}
                application={application}
                onView={() => setSelectedApplication(application)}
                onEdit={() => openEditModal(application)}
                onApprove={() => approveApplication(application)}
                onReject={() => rejectApplication(application)}
                onMoreInfo={() => requestMoreInfo(application)}
                t={t}
              />
            ))}
        </div>
      </div>

      {selectedApplication && (
        <ApplicationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onEdit={() => {
            openEditModal(selectedApplication);
            setSelectedApplication(null);
          }}
          onApprove={() => approveApplication(selectedApplication)}
          onReject={() => rejectApplication(selectedApplication)}
          onMoreInfo={() => requestMoreInfo(selectedApplication)}
          t={t}
        />
      )}

      {editingApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl text-[#284342] mb-6">
              {t('students.approval.editModal.title', { name: editingApplication.name })}
            </h2>

            <div className="space-y-4">
              <EditField
                label={t('students.approval.editModal.fullName')}
                value={editForm.fullName}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, fullName: value }))
                }
              />

              <EditField
                label={t('students.approval.editModal.email')}
                value={editForm.email}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, email: value }))
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <EditField
                  label={t('students.approval.editModal.phone')}
                  value={editForm.phone}
                  onChange={(value) =>
                    setEditForm((prev) => ({ ...prev, phone: value }))
                  }
                />

                <EditField
                  label={t('students.approval.editModal.icPassport')}
                  value={editForm.icPassport}
                  onChange={(value) =>
                    setEditForm((prev) => ({ ...prev, icPassport: value }))
                  }
                />
              </div>

              <EditField
                label={t('students.approval.editModal.emergencyContact')}
                value={editForm.emergencyContact}
                onChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    emergencyContact: value,
                  }))
                }
              />

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('students.approval.editModal.course')}
                </label>

                <select
                  value={editForm.courseId}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      courseId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="">{t('students.approval.editModal.selectCourse')}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setEditingApplication(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('students.approval.editModal.cancel')}
              </button>

              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
              >
                {savingEdit ? t('students.approval.editModal.saving') : t('students.approval.editModal.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
      />
    </div>
  );
}

function ApplicationCard({
  application,
  onView,
  onEdit,
  onApprove,
  onReject,
  onMoreInfo,
  t,
}: {
  application: PendingRegistration;
  onView: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMoreInfo: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="p-6 hover:bg-[#f8f8f6] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg text-[#284342]">{application.name}</h3>
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
              {t('students.approval.pendingBadge')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
            <Info label={t('students.approval.info.email')} value={application.email} />
            <Info label={t('students.approval.info.phone')} value={application.phone} />
            <Info label={t('students.approval.info.course')} value={application.course} />
            <Info label={t('students.approval.info.appliedDate')} value={application.appliedDate} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)] flex-wrap">
        <ActionButton
          onClick={onView}
          icon={<Eye size={16} />}
          label={t('students.approval.action.viewDetails')}
          variant="outline"
        />

        <ActionButton
          onClick={onEdit}
          icon={<Edit size={16} />}
          label={t('students.approval.action.edit')}
          variant="outline"
        />

        <ActionButton
          onClick={onApprove}
          icon={<CheckCircle size={16} />}
          label={t('students.approval.action.approve')}
          variant="green"
        />

        <ActionButton
          onClick={onReject}
          icon={<XCircle size={16} />}
          label={t('students.approval.action.reject')}
          variant="red"
        />

        <ActionButton
          onClick={onMoreInfo}
          label={t('students.approval.action.requestMoreInfo')}
          variant="blue"
        />
      </div>
    </div>
  );
}

function ApplicationModal({
  application,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onMoreInfo,
  t,
}: {
  application: PendingRegistration;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMoreInfo: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342]">{t('students.approval.modal.title')}</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Info label={t('students.approval.modal.fullName')} value={application.name} />
            <Info label={t('students.approval.modal.icPassport')} value={application.icPassport} />
            <Info label={t('students.approval.modal.email')} value={application.email} />
            <Info label={t('students.approval.modal.phone')} value={application.phone} />
            <Info
              label={t('students.approval.modal.emergencyContact')}
              value={application.emergencyContact}
            />
            <Info label={t('students.approval.modal.appliedDate')} value={application.appliedDate} />
          </div>

          <div>
            <p className="text-xs text-[#6b6b6b] mb-1">{t('students.approval.modal.courseApplied')}</p>
            <p className="text-sm text-[#284342]">{application.course}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentBox
              title={t('students.approval.doc.icDocument')}
              url={application.icDocumentUrl}
              t={t}
            />

            <DocumentBox
              title={t('students.approval.doc.signature')}
              url={application.signatureUrl}
              t={t}
            />
          </div>
        </div>

        <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            {t('students.approval.modal.close')}
          </button>

          <button
            onClick={onEdit}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center gap-2"
          >
            <Edit size={18} />
            {t('students.approval.modal.edit')}
          </button>

          <button
            onClick={onApprove}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle size={20} />
            {t('students.approval.modal.approveApplication')}
          </button>

          <button
            onClick={onReject}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <XCircle size={20} />
            {t('students.approval.modal.rejectApplication')}
          </button>

          <button
            onClick={onMoreInfo}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('students.approval.modal.requestMoreInfo')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentBox({ title, url, t }: { title: string; url: string; t: (key: string) => string }) {
  const isImage =
    url.toLowerCase().endsWith('.jpg') ||
    url.toLowerCase().endsWith('.jpeg') ||
    url.toLowerCase().endsWith('.png') ||
    url.startsWith('data:image');

  return (
    <div className="border border-[rgba(40,67,66,0.1)] rounded-lg p-4">
      <p className="text-sm text-[#284342] mb-3">{title}</p>

      {!url && (
        <div className="h-40 bg-[#f8f8f6] rounded-lg flex items-center justify-center text-sm text-[#6b6b6b]">
          {t('students.approval.doc.noneUploaded')}
        </div>
      )}

      {url && isImage && (
        <img
          src={url}
          alt={title}
          className="w-full h-40 object-contain bg-[#f8f8f6] rounded-lg border border-[rgba(40,67,66,0.1)]"
        />
      )}

      {url && !isImage && (
        <div className="h-40 bg-[#f8f8f6] rounded-lg flex flex-col items-center justify-center text-sm text-[#6b6b6b]">
          <FileText size={36} className="mb-3 text-[#284342]" />
          <p>{t('students.approval.doc.uploaded')}</p>
        </div>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 text-sm text-[#284342] hover:underline"
        >
          {t('students.approval.doc.openDocument')}
        </a>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div>
          <p className="text-sm text-[#6b6b6b]">{label}</p>
          <p className={`text-2xl ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  variant,
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  variant: 'outline' | 'green' | 'red' | 'blue';
}) {
  const className =
    variant === 'outline'
      ? 'px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2'
      : variant === 'green'
      ? 'px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm flex items-center gap-2'
      : variant === 'red'
      ? 'px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm flex items-center gap-2'
      : 'px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm flex items-center gap-2';

  return (
    <button onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function formatApplicationStatus(status: string): PendingRegistration['status'] {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'more_info_required') return 'More Info Required';
  return 'Pending';
}
