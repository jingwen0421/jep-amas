import { useEffect, useState } from 'react';
import { Download, Eye, Award, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Certificate {
  id: string;
  student: string;
  course: string;
  completionDate: string;
  certificateNumber: string;
  status: 'Issued' | 'Ready' | 'Pending';
  grade?: string;
  url?: string;
}

export default function CompletionCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  async function fetchCertificates() {
    setLoading(true);

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        certificate_url,
        issued_date,
        certificate_type,
        students(full_name),
        courses(course_name)
      `)
      .eq('certificate_type', 'completion')
      .order('issued_date', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error.message);
      setLoading(false);
      return;
    }

    const mapped: Certificate[] = (data || []).map((cert: any) => ({
      id: cert.id,
      student: getStudentName(cert.students),
      course: getCourseName(cert.courses),
      completionDate: cert.issued_date || '-',
      certificateNumber: cert.certificate_number || '-',
      status: cert.certificate_url ? 'Issued' : 'Ready',
      grade: 'Merit',
      url: cert.certificate_url,
    }));

    setCertificates(mapped);
    setLoading(false);
  }

  const issued = certificates.filter((c) => c.status === 'Issued').length;
  const ready = certificates.filter((c) => c.status === 'Ready').length;
  const pending = certificates.filter((c) => c.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Completion Certificates</h1>
          <p className="text-[#6b6b6b] mt-1">
            Generate and manage course completion certificates
          </p>
        </div>

        <button
          onClick={fetchCertificates}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          Refresh Certificates
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard icon={<CheckCircle size={24} className="text-green-700" />} label="Issued" value={issued} />
        <SummaryCard icon={<Award size={24} className="text-blue-700" />} label="Ready to Issue" value={ready} />
        <SummaryCard icon={<Award size={24} className="text-yellow-700" />} label="Pending" value={pending} />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Completion Certificates</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Certificate No.</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Student Name</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Completion Date</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Grade</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading certificates...
                  </td>
                </tr>
              )}

              {!loading && certificates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No certificates found.
                  </td>
                </tr>
              )}

              {!loading &&
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.certificateNumber}</td>
                    <td className="px-6 py-4 text-sm text-[#284342]">{cert.student}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.course}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.completionDate}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                        {cert.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        cert.status === 'Issued'
                          ? 'bg-green-100 text-green-700'
                          : cert.status === 'Ready'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cert.url && window.open(cert.url, '_blank')}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </button>
                        <button
                          onClick={() => cert.url && window.open(cert.url, '_blank')}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Download PDF"
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

      <div className="bg-white rounded-xl p-8 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-xl text-[#284342] mb-6">Certificate Preview</h2>
        <div className="border-4 border-[#284342] rounded-lg p-12 text-center bg-gradient-to-br from-white to-[#f8f8f6]">
          <Award size={64} className="mx-auto text-[#e9da95] mb-6" />
          <h1 className="text-4xl text-[#284342] mb-4">Certificate of Completion</h1>
          <div className="w-32 h-1 bg-[#e9da95] mx-auto mb-6" />
          <p className="text-lg text-[#6b6b6b] mb-2">This certifies that</p>
          <h2 className="text-3xl text-[#284342] mb-6">
            {certificates[0]?.student || 'Student Name'}
          </h2>
          <p className="text-lg text-[#6b6b6b] mb-2">has successfully completed</p>
          <h3 className="text-2xl text-[#284342] mb-8">
            {certificates[0]?.course || 'Course Name'}
          </h3>
          <p className="text-lg text-[#284342]">JEP Image Makeup Academy</p>
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

function getCourseName(course: any) {
  if (!course) return '-';
  if (Array.isArray(course)) return course[0]?.course_name || '-';
  return course.course_name || '-';
}