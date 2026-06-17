import { useEffect, useState } from 'react';
import { Award, Download, Eye, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AttendanceCertificate {
  id: string;
  student: string;
  course: string;
  attendanceRate: number;
  issueDate: string;
  certificateNumber: string;
  status: 'Issued' | 'Ready' | 'Pending';
  url?: string;
}

export default function AttendanceCertificates() {
  const [certificates, setCertificates] = useState<AttendanceCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  async function fetchCertificates() {
    setLoading(true);

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_type', 'attendance')
      .order('issued_date', { ascending: false });

    console.log('CERT DATA:', data);
    console.log('CERT ERROR:', error);

    if (error) {
      console.error('Error fetching attendance certificates:', error.message);
      setLoading(false);
      return;
    }

    const mapped: AttendanceCertificate[] = (data || []).map((cert: any) => ({
      id: cert.id,
      student: cert.student_id || 'Student',
      course: cert.course_id || '-',
      attendanceRate: 100,
      issueDate: cert.issued_date || '-',
      certificateNumber: cert.certificate_number || '-',
      status: cert.certificate_url ? 'Issued' : 'Ready',
      url: cert.certificate_url,
    }));

    setCertificates(mapped);
    setLoading(false);
  }

  async function generateAttendanceCertificate() {
    const { error } = await supabase
      .from('certificates')
      .insert({
        certificate_type: 'attendance',
        certificate_number: `JEP-ATT-${new Date().getFullYear()}-${Date.now()
          .toString()
          .slice(-3)}`,
        certificate_url: 'https://example.com/certificates/attendance.pdf',
        issued_date: new Date().toISOString().slice(0, 10),
      });

    if (error) {
      alert(`Failed to generate certificate: ${error.message}`);
      return;
    }

    fetchCertificates();
  }

  const issued = certificates.filter((c) => c.status === 'Issued').length;
  const ready = certificates.filter((c) => c.status === 'Ready').length;
  const pending = certificates.filter((c) => c.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            Full Attendance Certificates
          </h1>
          <p className="text-[#6b6b6b] mt-1">
            Award certificates for perfect attendance
          </p>
        </div>

        <button
          onClick={generateAttendanceCertificate}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          Generate Certificate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard icon={<CheckCircle size={24} className="text-green-700" />} label="Issued" value={issued} />
        <SummaryCard icon={<Award size={24} className="text-blue-700" />} label="Ready" value={ready} />
        <SummaryCard icon={<Award size={24} className="text-yellow-700" />} label="Pending" value={pending} />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Attendance Certificates</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Certificate No.</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Student</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Attendance Rate</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Issue Date</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading attendance certificates...
                  </td>
                </tr>
              )}

              {!loading && certificates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No attendance certificates found.
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
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          cert.status === 'Issued'
                            ? 'bg-green-100 text-green-700'
                            : cert.status === 'Ready'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cert.url && window.open(cert.url, '_blank')}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </button>
                        <button
                          onClick={() => cert.url && window.open(cert.url, '_blank')}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
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
    </div>
  );
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

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getCourseName(course: any, student: any) {
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
  if (Array.isArray(student)) return Number(student[0]?.attendance_rate || 100);
  return Number(student.attendance_rate || 100);
}