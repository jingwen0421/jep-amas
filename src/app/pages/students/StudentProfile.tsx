import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  ArrowLeft,
  ExternalLink,
  CreditCard,
  Briefcase,
  Edit,
  X,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';

interface StudentProfileData {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  icPassport: string;
  course: string;
  batch: string;
  status: string;
  progress: number;
  joinDate: string;
  emergencyContact: string;
  emergencyRelation: string;
  experience: string;
  healthCondition: string;
  icDocumentUrl: string;
  signatureUrl: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  lesson: string;
  status: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  type: string;
  status: string;
}

interface PortfolioRecord {
  id: string;
  title: string;
  date: string;
  score: string;
  status: string;
}

interface DocumentRecord {
  id: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface EditFormData {
  fullName: string;
  email: string;
  phone: string;
  icPassport: string;
  emergencyContact: string;
  emergencyRelation: string;
  experience: string;
  healthCondition: string;
  progress: string;
  status: string;
}

export default function StudentProfile() {
  const { id } = useParams();
  const currentUser = getCurrentUser();

  const canEditProfile =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin';

  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState<EditFormData>({
    fullName: '',
    email: '',
    phone: '',
    icPassport: '',
    emergencyContact: '',
    emergencyRelation: '',
    experience: '',
    healthCondition: '',
    progress: '0',
    status: 'active',
  });

  useEffect(() => {
    if (id) fetchStudentProfile(id);
  }, [id]);

  async function fetchStudentProfile(studentId: string) {
    setLoading(true);

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        student_code,
        full_name,
        email,
        phone,
        ic_passport,
        emergency_contact_phone,
        emergency_contact_name,
        makeup_experience,
        health_condition,
        status,
        progress,
        enroll_date,
        created_at,
        ic_document_url,
        signature_url
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) {
      console.error('Error fetching student:', studentError?.message);
      setLoading(false);
      return;
    }

    const [
      enrollmentRes,
      attendanceRes,
      paymentRes,
      planRes,
      portfolioRes,
      documentRes,
    ] = await Promise.all([
      supabase
        .from('enrollments')
        .select(`
          id,
          enrollment_status,
          class_batches(
            batch_name,
            courses(course_name)
          )
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('attendance')
        .select(`
          id,
          attendance_status,
          created_at,
          lessons(lesson_title, lesson_datetime)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('payments')
        .select('id, amount_paid, payment_method, paid_at')
        .eq('student_id', studentId)
        .order('paid_at', { ascending: false })
        .limit(5),

      supabase
        .from('payment_plans')
        .select(`
          final_amount,
          original_fee,
          installments(amount, status)
        `)
        .eq('student_id', studentId),

      supabase
        .from('portfolio_items')
        .select(`
          id,
          title,
          portfolio_status,
          submitted_at,
          portfolio_feedback(score)
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(5),

      supabase
        .from('documents')
        .select('id, document_type, file_url, uploaded_at')
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false }),
    ]);

    const enrollment = getSingle(enrollmentRes.data);
    const batch = getSingle(enrollment?.class_batches);
    const course = getSingle(batch?.courses);

    const mappedStudent: StudentProfileData = {
      id: studentData.id,
      studentCode: studentData.student_code || '-',
      name: studentData.full_name || 'Unnamed Student',
      email: studentData.email || '-',
      phone: studentData.phone || '-',
      icPassport: studentData.ic_passport || '-',
      course: course?.course_name || '-',
      batch: batch?.batch_name || '-',
      status: formatStudentStatus(studentData.status),
      progress: Number(studentData.progress || 0),
      joinDate:
        studentData.enroll_date ||
        studentData.created_at?.slice(0, 10) ||
        '-',
      emergencyContact: studentData.emergency_contact_phone || '-',
      emergencyRelation: studentData.emergency_contact_name || '-',
      experience: studentData.makeup_experience || '-',
      healthCondition: studentData.health_condition || '-',
      icDocumentUrl: studentData.ic_document_url || '',
      signatureUrl: studentData.signature_url || '',
    };

    setStudent(mappedStudent);

    setEditForm({
      fullName: studentData.full_name || '',
      email: studentData.email || '',
      phone: studentData.phone || '',
      icPassport: studentData.ic_passport || '',
      emergencyContact: studentData.emergency_contact_phone || '',
      emergencyRelation: studentData.emergency_contact_name || '',
      experience: studentData.makeup_experience || '',
      healthCondition: studentData.health_condition || '',
      progress: String(studentData.progress || 0),
      status: studentData.status || 'active',
    });

    setAttendanceRecords(
      (attendanceRes.data || []).map((record: any) => {
        const lesson = getSingle(record.lessons);

        return {
          id: record.id,
          date:
            lesson?.lesson_datetime?.slice(0, 10) ||
            record.created_at?.slice(0, 10) ||
            '-',
          lesson: lesson?.lesson_title || 'Lesson',
          status: formatAttendanceStatus(record.attendance_status),
        };
      })
    );

    setPaymentHistory(
      (paymentRes.data || []).map((payment: any) => ({
        id: payment.id,
        date: payment.paid_at ? payment.paid_at.slice(0, 10) : '-',
        amount: Number(payment.amount_paid || 0),
        type: formatPaymentMethod(payment.payment_method || 'Payment'),
        status: 'Paid',
      }))
    );

    const plans = planRes.data || [];

    const totalFee = plans.reduce(
      (sum: number, plan: any) =>
        sum + Number(plan.final_amount || plan.original_fee || 0),
      0
    );

    const paidAmount = plans.reduce((sum: number, plan: any) => {
      const paid = (plan.installments || [])
        .filter((item: any) => String(item.status).toLowerCase() === 'paid')
        .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

      return sum + paid;
    }, 0);

    setOutstandingBalance(Math.max(totalFee - paidAmount, 0));

    setPortfolioItems(
      (portfolioRes.data || []).map((item: any) => {
        const feedback = getSingle(item.portfolio_feedback);
        const score = feedback?.score;

        return {
          id: item.id,
          title: item.title || 'Portfolio Submission',
          date: item.submitted_at ? item.submitted_at.slice(0, 10) : '-',
          score: score !== undefined && score !== null ? `${score}%` : '-',
          status: formatPortfolioStatus(item.portfolio_status),
        };
      })
    );

    setDocuments(
      (documentRes.data || []).map((doc: any) => ({
        id: doc.id,
        type: doc.document_type || 'Document',
        url: doc.file_url || '',
        uploadedAt: doc.uploaded_at ? doc.uploaded_at.slice(0, 10) : '-',
      }))
    );

    setLoading(false);
  }

  async function saveStudentProfile() {
    if (!student) return;

    if (!editForm.fullName.trim()) {
      alert('Full name is required.');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('students')
      .update({
        full_name: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        ic_passport: editForm.icPassport.trim(),
        emergency_contact_phone: editForm.emergencyContact.trim(),
        emergency_contact_name: editForm.emergencyRelation.trim(),
        makeup_experience: editForm.experience,
        health_condition: editForm.healthCondition,
        progress: Number(editForm.progress || 0),
        status: editForm.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', student.id);

    if (error) {
      alert(`Failed to update student profile: ${error.message}`);
      setSaving(false);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Student Profile Updated',
      module: 'Student Management',
      target_id: student.id,
      old_data: {
        name: student.name,
        email: student.email,
        phone: student.phone,
        progress: student.progress,
        status: student.status,
      },
      new_data: {
        ...editForm,
        updated_by: currentUser.email,
      },
      created_at: new Date().toISOString(),
    });

    setSaving(false);
    setShowEditModal(false);

    await fetchStudentProfile(student.id);
  }

  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round(
          (attendanceRecords.filter(
            (record) => record.status === 'Present' || record.status === 'Late'
          ).length /
            attendanceRecords.length) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
        Loading student profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <Link to="/app/students/list" className="text-[#284342] hover:underline">
          Back to Student List
        </Link>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Student not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/students/list"
        className="inline-flex items-center gap-2 text-sm text-[#284342] hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Student List
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-[#284342]">Student Profile</h1>

        {canEditProfile && (
          <button
            onClick={() => setShowEditModal(true)}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-[#e9da95] flex items-center justify-center text-[#284342] text-3xl">
            {getInitials(student.name)}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl text-[#284342]">{student.name}</h2>
              <StatusBadge status={student.status} />
            </div>

            <p className="text-[#6b6b6b] mb-4">
              Student ID: {student.studentCode}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ContactInfo icon={<Mail size={16} />} value={student.email} />
              <ContactInfo icon={<Phone size={16} />} value={student.phone} />
              <ContactInfo icon={<Calendar size={16} />} value={`Joined ${student.joinDate}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Course Progress"
          value={`${student.progress}%`}
          icon={<TrendingUp size={20} />}
          progress={student.progress}
        />

        <StatCard
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={<Award size={20} />}
        />

        <StatCard
          label="Portfolio Items"
          value={portfolioItems.length.toString()}
          icon={<Briefcase size={20} />}
        />

        <StatCard
          label="Outstanding Balance"
          value={`RM ${outstandingBalance.toLocaleString()}`}
          icon={<CreditCard size={20} />}
          danger={outstandingBalance > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Course Details">
          <Info label="Course" value={student.course} />
          <Info label="Batch" value={student.batch} />
          <Info label="Experience Level" value={student.experience} />
          <Info label="Health Condition / Allergies" value={student.healthCondition} />
          <Info label="Emergency Contact" value={student.emergencyContact} />
          <Info label="Emergency Relation" value={student.emergencyRelation} />
        </Panel>

        <Panel title="Registration Documents">
          <DocumentLink label="IC / Passport Copy" url={student.icDocumentUrl} />
          <DocumentLink label="Digital Signature" url={student.signatureUrl} />

          {documents.map((doc) => (
            <DocumentLink
              key={doc.id}
              label={`${doc.type} (${doc.uploadedAt})`}
              url={doc.url}
            />
          ))}
        </Panel>

        <Panel title="Recent Attendance">
          {attendanceRecords.length === 0 && <EmptyText text="No attendance records." />}

          {attendanceRecords.map((record) => (
            <ListRow
              key={record.id}
              title={record.lesson}
              subtitle={record.date}
              right={<AttendanceBadge status={record.status} />}
            />
          ))}
        </Panel>

        <Panel title="Payment History">
          {paymentHistory.length === 0 && <EmptyText text="No payment records." />}

          {paymentHistory.map((payment) => (
            <ListRow
              key={payment.id}
              title={payment.type}
              subtitle={payment.date}
              right={
                <div className="text-right">
                  <p className="text-sm text-[#284342]">
                    RM {payment.amount.toLocaleString()}
                  </p>
                  <span className="text-xs text-green-700">{payment.status}</span>
                </div>
              }
            />
          ))}
        </Panel>

        <Panel title="Portfolio Submissions">
          {portfolioItems.length === 0 && <EmptyText text="No portfolio submissions." />}

          {portfolioItems.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={item.date}
              right={
                <div className="text-right">
                  <p className="text-sm text-[#284342]">{item.score}</p>
                  <span className="text-xs text-green-700">{item.status}</span>
                </div>
              }
            />
          ))}
        </Panel>
      </div>

      {showEditModal && (
        <EditStudentModal
          form={editForm}
          setForm={setEditForm}
          saving={saving}
          onClose={() => setShowEditModal(false)}
          onSave={saveStudentProfile}
        />
      )}
    </div>
  );
}

function EditStudentModal({
  form,
  setForm,
  saving,
  onClose,
  onSave,
}: {
  form: EditFormData;
  setForm: React.Dispatch<React.SetStateAction<EditFormData>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  function updateField(field: keyof EditFormData, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-xl text-[#284342]">Edit Student Profile</h2>

          <button onClick={onClose}>
            <X size={20} className="text-[#284342]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Full Name"
              value={form.fullName}
              onChange={(value) => updateField('fullName', value)}
            />

            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => updateField('email', value)}
            />

            <InputField
              label="Phone"
              value={form.phone}
              onChange={(value) => updateField('phone', value)}
            />

            <InputField
              label="IC / Passport"
              value={form.icPassport}
              onChange={(value) => updateField('icPassport', value)}
            />

            <InputField
              label="Emergency Contact"
              value={form.emergencyContact}
              onChange={(value) => updateField('emergencyContact', value)}
            />

            <InputField
              label="Emergency Relation"
              value={form.emergencyRelation}
              onChange={(value) => updateField('emergencyRelation', value)}
            />

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Experience Level
              </label>

              <select
                value={form.experience}
                onChange={(e) => updateField('experience', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
              >
                <option value="">Select Experience</option>
                <option value="Beginner">Beginner</option>
                <option value="Some Experience">Some Experience</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <InputField
              label="Progress (%)"
              type="number"
              value={form.progress}
              onChange={(value) => updateField('progress', value)}
            />
          </div>

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Health Condition / Allergies
            </label>

            <textarea
              value={form.healthCondition}
              onChange={(e) => updateField('healthCondition', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
            />
          </div>
        </div>

        <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6]"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h3 className="text-lg text-[#284342] mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
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

function ContactInfo({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[#6b6b6b]">
      {icon}
      <span className="text-sm">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  progress,
  danger = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  progress?: number;
  danger?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#6b6b6b]">{label}</span>
        <span className={danger ? 'text-[#d4183d]' : 'text-[#284342]'}>
          {icon}
        </span>
      </div>

      <p className={`text-2xl ${danger ? 'text-[#d4183d]' : 'text-[#284342]'} mb-1`}>
        {value}
      </p>

      {progress !== undefined && (
        <div className="w-full h-2 bg-[#e8e7e2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#284342] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ListRow({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f8f6]">
      <div>
        <p className="text-sm text-[#284342]">{title}</p>
        <p className="text-xs text-[#6b6b6b] mt-1">{subtitle}</p>
      </div>

      {right}
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-[#6b6b6b]">{text}</p>;
}

function DocumentLink({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f8f6]">
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-[#284342]" />
        <span className="text-sm text-[#284342]">{label}</span>
      </div>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[#284342] hover:underline flex items-center gap-1"
        >
          Open <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-xs text-[#6b6b6b]">Not uploaded</span>
      )}
    </div>
  );
}

function AttendanceBadge({ status }: { status: string }) {
  const className =
    status === 'Present'
      ? 'bg-green-100 text-green-700'
      : status === 'Late'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'Active'
      ? 'bg-green-100 text-green-700'
      : status === 'Completed'
      ? 'bg-blue-100 text-blue-700'
      : status === 'Suspended'
      ? 'bg-red-100 text-red-700'
      : status === 'Inactive'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-sm px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function formatStudentStatus(status: string) {
  if (status === 'active') return 'Active';
  if (status === 'completed') return 'Completed';
  if (status === 'inactive') return 'Inactive';
  if (status === 'suspended') return 'Suspended';
  return 'On Hold';
}

function formatAttendanceStatus(status: string) {
  if (status === 'present') return 'Present';
  if (status === 'late') return 'Late';
  if (status === 'absent') return 'Absent';
  return status || '-';
}

function formatPortfolioStatus(status: string) {
  if (status === 'approved') return 'Approved';
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'revision_required') return 'Revision Required';
  if (status === 'submitted') return 'Submitted';
  return status || '-';
}

function formatPaymentMethod(method: string) {
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}