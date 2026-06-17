import { Award, Download, Eye, CheckCircle } from 'lucide-react';

interface AttendanceCertificate {
  id: string;
  student: string;
  course: string;
  attendanceRate: number;
  issueDate: string;
  certificateNumber: string;
  status: 'Issued' | 'Ready' | 'Pending';
}

export default function AttendanceCertificates() {
  const certificates: AttendanceCertificate[] = [
    {
      id: 'AC001',
      student: 'Grace Lim Xin Yi',
      course: 'Professional Makeup Artist Course',
      attendanceRate: 100,
      issueDate: '2026-05-30',
      certificateNumber: 'JEP-ATT-2026-001',
      status: 'Issued',
    },
    {
      id: 'AC002',
      student: 'Jennifer Wong',
      course: 'Bridal Makeup Specialist',
      attendanceRate: 100,
      issueDate: '2026-05-28',
      certificateNumber: 'JEP-ATT-2026-002',
      status: 'Ready',
    },
    {
      id: 'AC003',
      student: 'Kelly Tan',
      course: 'Advanced Airbrush Course',
      attendanceRate: 100,
      issueDate: '2026-06-10',
      certificateNumber: 'JEP-ATT-2026-003',
      status: 'Pending',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Full Attendance Certificates</h1>
          <p className="text-[#6b6b6b] mt-1">Award certificates for perfect attendance</p>
        </div>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors">
          Generate Certificate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={24} className="text-green-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Issued</p>
              <p className="text-2xl text-[#284342]">
                {certificates.filter((c) => c.status === 'Issued').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <Award size={24} className="text-blue-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Ready</p>
              <p className="text-2xl text-[#284342]">
                {certificates.filter((c) => c.status === 'Ready').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <Award size={24} className="text-yellow-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Pending</p>
              <p className="text-2xl text-[#284342]">
                {certificates.filter((c) => c.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
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
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-[#f8f8f6] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.certificateNumber}</td>
                  <td className="px-6 py-4 text-sm text-[#284342]">{cert.student}</td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.course}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-green-700 font-semibold">{cert.attendanceRate}%</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.issueDate}</td>
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
                      <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors">
                        <Eye size={16} className="text-[#284342]" />
                      </button>
                      <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors">
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
