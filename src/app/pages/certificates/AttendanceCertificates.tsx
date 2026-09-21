import { useEffect, useRef, useState } from 'react';
import { Award, Download, Eye, CheckCircle, Plus, X, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';

interface AttendanceCertificate {
  id: string;
  studentId: string;
  courseId: string;
  student: string;
  course: string;
  attendanceRate: number;
  issueDate: string;
  certificateNumber: string;
  status: 'Issued' | 'Ready' | 'Pending';
  url?: string;
}

interface EligibleStudent {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  student: string;
  course: string;
  attendanceRate: number;
}

export default function AttendanceCertificates() {
  const { t } = useLanguage();
  const [certificates, setCertificates] = useState<AttendanceCertificate[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [selectedCert, setSelectedCert] = useState<AttendanceCertificate | null>(null);
  const [selectedEligible, setSelectedEligible] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();
  const isStudentView = currentUser.role === 'student';
  const canIssueCertificate =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'owner';

  const certificateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  fetchCertificates();

  if (canIssueCertificate) {
    fetchEligibleStudents();
  }
}, []);

 async function fetchCertificates() {
  setLoading(true);

  const currentUser = getCurrentUser();

  let query = supabase
    .from('certificates')
    .select(`
      id,
      student_id,
      course_id,
      certificate_number,
      certificate_url,
      issued_date,
      certificate_type,
      students(full_name, email, attendance_rate),
      courses(course_name)
    `)
    .eq('certificate_type', 'attendance')
    .order('issued_date', { ascending: false });

  if (currentUser.role === 'student') {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
      setCertificates([]);
      setLoading(false);
      return;
    }

    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance certificates:', error.message);
    setLoading(false);
    return;
  }

  const mapped: AttendanceCertificate[] = (data || []).map((cert: any) => ({
    id: cert.id,

    studentId: cert.student_id || '',
    courseId: cert.course_id || '',

    student: getStudentName(cert.students, t),
    course: getCourseName(cert.courses, cert.students),
    attendanceRate: getAttendanceRate(cert.students),
    issueDate: cert.issued_date || '-',
    certificateNumber: cert.certificate_number || '-',
    status: cert.certificate_url ? 'Issued' : 'Ready',
    url: cert.certificate_url,
  }));

  setCertificates(mapped);
  setLoading(false);
}

  async function fetchEligibleStudents() {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        enrollment_status,
        students(id, full_name),
        class_batches(
          courses(id, course_name)
        )
      `)
      .eq('enrollment_status', 'active');

    if (error) {
      console.error('Error fetching eligible students:', error.message);
      return;
    }

    const mapped: EligibleStudent[] = [];

    for (const enrollment of data || []) {
      const student = getSingle(enrollment.students);
      const batch = getSingle(enrollment.class_batches);
      const course = getSingle(batch?.courses);

      if (!student?.id || !course?.id) continue;

      const attendanceRate = await calculateAttendanceRate(student.id);

      if (attendanceRate === 100) {
        mapped.push({
          enrollmentId: enrollment.id,
          studentId: student.id,
          courseId: course.id,
          student: student.full_name || t('dashboard.fallback.unnamedStudent'),
          course: course.course_name || '-',
          attendanceRate,
        });
      }
    }

    setEligibleStudents(mapped);
  }

  async function calculateAttendanceRate(studentId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_status')
      .eq('student_id', studentId);

    if (error || !data || data.length === 0) return 100;

    const attended = data.filter((record: any) =>
      ['present', 'late'].includes(String(record.attendance_status).toLowerCase())
    ).length;

    return Math.round((attended / data.length) * 100);
  }

  async function issueAttendanceCertificate() {
    const selected = eligibleStudents.find(
      (item) => item.enrollmentId === selectedEligible
    );

    if (!selected) {
      alert(t('payments.plans.selectStudent'));
      return;
    }

    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', selected.studentId)
      .eq('course_id', selected.courseId)
      .eq('certificate_type', 'attendance')
      .maybeSingle();

    if (existing) {
      alert(t('certificates.attendance.alreadyIssued'));
      return;
    }

    const certificateNumber = `JEP-ATT-${new Date().getFullYear()}-${Date.now()
      .toString()
      .slice(-6)}`;

    const { data: created, error } = await supabase
      .from('certificates')
      .insert({
        student_id: selected.studentId,
        course_id: selected.courseId,
        certificate_type: 'attendance',
        certificate_number: certificateNumber,
        certificate_url: null,
        issued_date: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      alert(t('certificates.completion.errorIssueFailed', { message: error.message }));
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Full Attendance Certificate Issued',
      module: 'Certificates',
      target_id: created.id,
      old_data: null,
      new_data: {
        student: selected.student,
        course: selected.course,
        attendance_rate: selected.attendanceRate,
        certificate_number: certificateNumber,
      },
      created_at: new Date().toISOString(),
    });

    setShowModal(false);
    setSelectedEligible('');
    fetchCertificates();
    fetchEligibleStudents();
  }

 async function downloadCertificate(cert: AttendanceCertificate) {
  if (!certificateRef.current) {
    alert(t('certificates.completion.previewFirst'));
    return;
  }
  
  const clonedElement = certificateRef.current.cloneNode(true) as HTMLElement;
  sanitizeColors(clonedElement);
  clonedElement.style.position = 'fixed';
  clonedElement.style.left = '-9999px';
  clonedElement.style.top = '0';
  clonedElement.style.width = '1200px';
  clonedElement.style.background = '#ffffff';
  clonedElement.style.color = '#284342';

  clonedElement.querySelectorAll('*').forEach((el) => {
    const item = el as HTMLElement;
    item.style.color = item.style.color || '#284342';
    item.style.backgroundColor = item.style.backgroundColor || 'transparent';
  });

  document.body.appendChild(clonedElement);

  const canvas = await html2canvas(clonedElement, {
    scale: 2,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'PNG', 10, 10, pageWidth - 20, pageHeight - 20);
  pdf.save(`${cert.certificateNumber}.pdf`);

  document.body.removeChild(clonedElement);
}

  function printCertificate(cert: AttendanceCertificate) {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert(t('payments.receipts.errorPrintWindow'));
      return;
    }

    printWindow.document.write(generateCertificateHtml(cert, t));
    printWindow.document.close();
    printWindow.print();
  }

  const issued = certificates.length;
  const ready = eligibleStudents.length;
  const pending = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            {t('certificates.attendance.title')}
          </h1>
          <p className="text-[#6b6b6b] mt-1">
  {isStudentView
    ? t('certificates.attendance.subtitleStudent')
    : t('certificates.attendance.subtitle')}
</p>
        </div>

        {canIssueCertificate && (
  <button
    onClick={() => setShowModal(true)}
    className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
  >
    <Plus size={18} />
    {t('certificates.completion.issueCertificate')}
  </button>
)}
      </div>

     {!isStudentView && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <SummaryCard
      icon={<CheckCircle size={24} className="text-green-700" />}
      label={t('certificates.completion.issued')}
      value={issued}
    />
    <SummaryCard
      icon={<Award size={24} className="text-blue-700" />}
      label={t('certificates.completion.eligibleStudents')}
      value={ready}
    />
    <SummaryCard
      icon={<Award size={24} className="text-yellow-700" />}
      label={t('common.pending')}
      value={pending}
    />
  </div>
)}

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('certificates.attendance.title')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('certificates.completion.certificateNo')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('payments.installments.colStudent')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('payments.installments.colCourse')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('certificates.attendance.attendanceRate')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('certificates.attendance.issueDate')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('payments.installments.colStatus')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('payments.installments.colActions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('certificates.attendance.loading')}
                  </td>
                </tr>
              )}

              {!loading && certificates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('certificates.attendance.empty')}
                  </td>
                </tr>
              )}

              {!loading &&
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {cert.certificateNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {cert.student}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {cert.course}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-green-700 font-semibold">
                        {cert.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {cert.issueDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                        {cert.status === 'Issued' ? t('payments.receipts.statusIssued') : t('certificates.completion.statusReady')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title={t('payments.receipts.preview')}
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => printCertificate(cert)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title={t('payments.receipts.print')}
                        >
                          <Printer size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => downloadCertificate(cert)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title={t('certificates.completion.downloadPdf')}
                        >
                          <Download size={16} className="text-[#284342]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {certificates[0] && (
        <div className="bg-white rounded-xl p-8 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">{t('certificates.completion.certificatePreview')}</h2>
          <div ref={certificateRef}>
            <CertificatePreview cert={certificates[0]} t={t} />
          </div>
        </div>
      )}

      {selectedCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
              <h2 className="text-xl text-[#284342]">{t('certificates.completion.certificatePreview')}</h2>
              <button onClick={() => setSelectedCert(null)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="p-6">
              <CertificatePreview cert={selectedCert} t={t} />
            </div>

            <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('payments.receipts.close')}
              </button>

              <button
                onClick={() => downloadCertificate(selectedCert)}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {t('certificates.completion.downloadPdf')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">
                {t('certificates.attendance.issueModalTitle')}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                {t('certificates.completion.studentCourseLabel')}
              </label>
              <select
                value={selectedEligible}
                onChange={(e) => setSelectedEligible(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="">{t('payments.plans.selectStudentOption')}</option>
                {eligibleStudents.map((item) => (
                  <option key={item.enrollmentId} value={item.enrollmentId}>
                    {item.student} - {item.course} ({item.attendanceRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('common.cancel')}
              </button>

              <button
                onClick={issueAttendanceCertificate}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {t('certificates.completion.issueCertificate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CertificatePreview({ cert, t }: { cert: AttendanceCertificate; t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <div className="certificate border-4 border-[#284342] rounded-lg p-12 text-center bg-gradient-to-br from-white to-[#f8f8f6]">
      <Award size={70} className="mx-auto text-[#e9da95] mb-6" />

      <h1 className="text-4xl text-[#284342] mb-4">
        {t('certificates.attendance.certificateTitle')}
      </h1>

      <div className="w-32 h-1 bg-[#e9da95] mx-auto mb-8" />

      <p className="text-lg text-[#6b6b6b] mb-2">{t('certificates.completion.thisCertifiesThat')}</p>

      <h2 className="text-3xl text-[#284342] mb-6">{cert.student}</h2>

      <p className="text-lg text-[#6b6b6b] mb-2">
        {t('certificates.attendance.hasAchievedFullAttendance')}
      </p>

      <h3 className="text-2xl text-[#284342] mb-8">{cert.course}</h3>

      <p className="text-lg text-green-700 mb-6">
        {t('certificates.attendance.attendanceRateLabel', { rate: cert.attendanceRate })}
      </p>

      <p className="text-sm text-[#6b6b6b] mb-2">
        {t('certificates.completion.certificateNoLabel', { number: cert.certificateNumber })}
      </p>

      <p className="text-sm text-[#6b6b6b] mb-10">
        {t('certificates.completion.dateLabel', { date: cert.issueDate })}
      </p>

      <div className="flex justify-between items-end mt-12">
        <div>
          <div className="w-48 h-px bg-[#284342] mb-2" />
          <p className="text-sm text-[#6b6b6b]">{t('certificates.completion.directorSignature')}</p>
        </div>

        <div>
          <p className="text-lg text-[#284342]">JEP Image Makeup Academy</p>
          <p className="text-sm text-[#6b6b6b] mt-2">{t('certificates.completion.officialCertificate')}</p>
        </div>

        <div>
          <div className="w-48 h-px bg-[#284342] mb-2" />
          <p className="text-sm text-[#6b6b6b]">{t('certificates.completion.instructorSignature')}</p>
        </div>
      </div>
    </div>
  );
}

function generateCertificateHtml(cert: AttendanceCertificate, t: (key: string, params?: Record<string, string | number>) => string) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${cert.certificateNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #284342;
      background: white;
    }
    .certificate {
      border: 6px solid #284342;
      border-radius: 16px;
      padding: 70px;
      text-align: center;
      max-width: 1000px;
      margin: auto;
      background: linear-gradient(135deg, #ffffff, #f8f8f6);
    }
    .award {
      font-size: 70px;
      color: #e9da95;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 44px;
      color: #284342;
      margin-bottom: 16px;
    }
    .gold-line {
      width: 150px;
      height: 4px;
      background: #e9da95;
      margin: 0 auto 36px;
    }
    .muted {
      color: #6b6b6b;
      font-size: 18px;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 36px;
      color: #284342;
      margin: 24px 0;
    }
    h3 {
      font-size: 28px;
      color: #284342;
      margin: 24px 0 36px;
    }
    .attendance {
      color: #15803d;
      font-size: 22px;
      margin-bottom: 30px;
    }
    .small {
      font-size: 14px;
      color: #6b6b6b;
      margin-bottom: 8px;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 80px;
    }
    .signature-box {
      width: 220px;
      text-align: center;
    }
    .signature-line {
      height: 1px;
      background: #284342;
      margin-bottom: 10px;
    }
    .academy-title {
      font-size: 20px;
      color: #284342;
      margin-bottom: 8px;
    }
  </style>
</head>

<body>
  <div class="certificate">
    <div class="award">🏆</div>

    <h1>${t('certificates.attendance.certificateTitle')}</h1>
    <div class="gold-line"></div>

    <p class="muted">${t('certificates.completion.thisCertifiesThat')}</p>

    <h2>${cert.student}</h2>

    <p class="muted">${t('certificates.attendance.hasAchievedFullAttendance')}</p>

    <h3>${cert.course}</h3>

    <p class="attendance">${t('certificates.attendance.attendanceRateLabel', { rate: cert.attendanceRate })}</p>

    <p class="small">${t('certificates.completion.certificateNoLabel', { number: cert.certificateNumber })}</p>
    <p class="small">${t('certificates.completion.dateLabel', { date: cert.issueDate })}</p>

    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line"></div>
        <p class="small">${t('certificates.completion.directorSignature')}</p>
      </div>

      <div>
        <p class="academy-title">JEP Image Makeup Academy</p>
        <p class="small">${t('certificates.completion.officialCertificate')}</p>
      </div>

      <div class="signature-box">
        <div class="signature-line"></div>
        <p class="small">${t('certificates.completion.instructorSignature')}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div>
          <p className="text-sm text-[#6b6b6b]">{label}</p>
          <p className="text-2xl text-[#284342]">{value}</p>
        </div>
      </div>
    </div>
  );
}



function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function sanitizeColors(element: HTMLElement) {
  element.querySelectorAll('*').forEach((node) => {
    const el = node as HTMLElement;
    const style = window.getComputedStyle(el);

    if (style.color.includes('oklch')) {
      el.style.color = '#284342';
    }

    if (style.backgroundColor.includes('oklch')) {
      el.style.backgroundColor = 'transparent';
    }

    if (style.borderColor.includes('oklch')) {
      el.style.borderColor = '#284342';
    }
  });
}

function getStudentName(student: any, t: (key: string) => string) {
  if (!student) return t('dashboard.fallback.unnamedStudent');

  if (Array.isArray(student)) {
    return student[0]?.full_name || t('dashboard.fallback.unnamedStudent');
  }

  return student.full_name || t('dashboard.fallback.unnamedStudent');
}

function getCourseName(course: any, student?: any) {
  if (course) {
    if (Array.isArray(course)) return course[0]?.course_name || '-';
    return course.course_name || '-';
  }

  if (student) {
    if (Array.isArray(student)) return student[0]?.course || '-';
    return student.course || '-';
  }

  return '-';
}

function getAttendanceRate(student: any) {
  if (!student) return 100;

  if (Array.isArray(student)) {
    return Number(student[0]?.attendance_rate || 100);
  }

  return Number(student.attendance_rate || 100);
}