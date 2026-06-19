import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

export default function RegistrationApproval() {
  const [selectedApplication, setSelectedApplication] =
    useState<PendingRegistration | null>(null);

  const [applications, setApplications] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

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
        name: student?.full_name || 'Unnamed Student',
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
    const { error: appError } = await supabase
      .from('registration_applications')
      .update({
        application_status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application.applicationId);

    if (appError) {
      alert(`Failed to approve application: ${appError.message}`);
      return;
    }

    const { error: studentError } = await supabase
      .from('students')
      .update({ status: 'active' })
      .eq('id', application.studentDbId);

    if (studentError) {
      alert(`Application approved, but failed to activate student: ${studentError.message}`);
      return;
    }

    await createEnrollmentIfPossible(application);
    await createAuditLog(
      'Approved Registration',
      'Student Management',
      application.studentDbId,
      {
        student_name: application.name,
        course: application.course,
      }
    );

    setSelectedApplication(null);
    fetchApplications();
  }

  async function rejectApplication(application: PendingRegistration) {
    const { error: appError } = await supabase
      .from('registration_applications')
      .update({
        application_status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application.applicationId);

    if (appError) {
      alert(`Failed to reject application: ${appError.message}`);
      return;
    }

    const { error: studentError } = await supabase
      .from('students')
      .update({ status: 'suspended' })
      .eq('id', application.studentDbId);

    if (studentError) {
      alert(`Application rejected, but failed to update student: ${studentError.message}`);
      return;
    }

    await createAuditLog(
      'Rejected Registration',
      'Student Management',
      application.studentDbId,
      {
        student_name: application.name,
        course: application.course,
      }
    );

    setSelectedApplication(null);
    fetchApplications();
  }

  async function requestMoreInfo(application: PendingRegistration) {
    const { error } = await supabase
      .from('registration_applications')
      .update({
        application_status: 'more_info_required',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application.applicationId);

    if (error) {
      alert(`Failed to request more info: ${error.message}`);
      return;
    }

    await createAuditLog(
      'Requested More Info',
      'Student Management',
      application.studentDbId,
      {
        student_name: application.name,
        course: application.course,
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
      .maybeSingle();

    if (existingEnrollment) return;

    const { data: batch } = await supabase
      .from('class_batches')
      .select('id')
      .eq('course_id', application.courseId)
      .limit(1)
      .maybeSingle();

    if (!batch) return;

    await supabase.from('enrollments').insert({
      student_id: application.studentDbId,
      batch_id: batch.id,
      enrollment_status: 'active',
      enrolled_at: new Date().toISOString(),
    });
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
        <h1 className="text-3xl text-[#284342]">Registration Approval</h1>
        <p className="text-[#6b6b6b] mt-1">
          Review and approve student registration applications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          label="Pending Review"
          value={pendingApplications.length}
          color="text-yellow-700"
          icon={<AlertCircle size={24} className="text-yellow-700" />}
        />
        <SummaryCard label="Approved" value={approvedCount} color="text-green-700" />
        <SummaryCard label="Rejected" value={rejectedCount} color="text-red-700" />
        <SummaryCard label="More Info" value={moreInfoCount} color="text-blue-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Pending Applications</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading applications...
            </div>
          )}

          {!loading && pendingApplications.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No pending applications.
            </div>
          )}

          {!loading &&
            pendingApplications.map((application) => (
              <ApplicationCard
                key={application.applicationId}
                application={application}
                onView={() => setSelectedApplication(application)}
                onApprove={() => approveApplication(application)}
                onReject={() => rejectApplication(application)}
                onMoreInfo={() => requestMoreInfo(application)}
              />
            ))}
        </div>
      </div>

      {selectedApplication && (
        <ApplicationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onApprove={() => approveApplication(selectedApplication)}
          onReject={() => rejectApplication(selectedApplication)}
          onMoreInfo={() => requestMoreInfo(selectedApplication)}
        />
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  onView,
  onApprove,
  onReject,
  onMoreInfo,
}: {
  application: PendingRegistration;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMoreInfo: () => void;
}) {
  return (
    <div className="p-6 hover:bg-[#f8f8f6] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg text-[#284342]">{application.name}</h3>
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
              Pending Review
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
            <Info label="Email" value={application.email} />
            <Info label="Phone" value={application.phone} />
            <Info label="Course" value={application.course} />
            <Info label="Applied Date" value={application.appliedDate} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)] flex-wrap">
        <ActionButton onClick={onView} icon={<Eye size={16} />} label="View Details" variant="outline" />
        <ActionButton onClick={onApprove} icon={<CheckCircle size={16} />} label="Approve" variant="green" />
        <ActionButton onClick={onReject} icon={<XCircle size={16} />} label="Reject" variant="red" />
        <ActionButton onClick={onMoreInfo} label="Request More Info" variant="blue" />
      </div>
    </div>
  );
}

function ApplicationModal({
  application,
  onClose,
  onApprove,
  onReject,
  onMoreInfo,
}: {
  application: PendingRegistration;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMoreInfo: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342]">Application Details</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Info label="Full Name" value={application.name} />
            <Info label="IC/Passport" value={application.icPassport} />
            <Info label="Email" value={application.email} />
            <Info label="Phone" value={application.phone} />
            <Info label="Emergency Contact" value={application.emergencyContact} />
            <Info label="Applied Date" value={application.appliedDate} />
          </div>

          <div>
            <p className="text-xs text-[#6b6b6b] mb-1">Course Applied</p>
            <p className="text-sm text-[#284342]">{application.course}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentBox
              title="IC / Passport Document"
              url={application.icDocumentUrl}
            />
            <DocumentBox
              title="Digital Signature"
              url={application.signatureUrl}
            />
          </div>
        </div>

        <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            Close
          </button>

          <button
            onClick={onApprove}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle size={20} />
            Approve Application
          </button>

          <button
            onClick={onReject}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <XCircle size={20} />
            Reject Application
          </button>

          <button
            onClick={onMoreInfo}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request More Info
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentBox({ title, url }: { title: string; url: string }) {
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
          No document uploaded
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
          <p>Document uploaded</p>
        </div>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 text-sm text-[#284342] hover:underline"
        >
          Open Document
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