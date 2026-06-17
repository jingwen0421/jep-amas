import { Download, Eye, Award, CheckCircle } from 'lucide-react';

interface Certificate {
  id: string;
  student: string;
  course: string;
  completionDate: string;
  certificateNumber: string;
  status: 'Issued' | 'Ready' | 'Pending';
  grade?: string;
}

export default function CompletionCertificates() {
  const certificates: Certificate[] = [
    { id: 'C001', student: 'Grace Lim Xin Yi', course: 'Professional Makeup Artist Course', completionDate: '2026-05-30', certificateNumber: 'JEP-PMAC-2026-001', status: 'Issued', grade: 'Distinction' },
    { id: 'C002', student: 'Vivian Lee', course: 'Bridal Makeup Specialist', completionDate: '2026-05-28', certificateNumber: 'JEP-BMS-2026-002', status: 'Ready', grade: 'Merit' },
    { id: 'C003', student: 'Christine Tan', course: 'Advanced Airbrush Course', completionDate: '2026-05-25', certificateNumber: 'JEP-AAC-2026-003', status: 'Ready', grade: 'Distinction' },
    { id: 'C004', student: 'Rachel Tan Li Ying', course: 'Professional Makeup Artist Course', completionDate: '2026-06-10', certificateNumber: 'JEP-PMAC-2026-004', status: 'Pending', grade: 'Merit' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Completion Certificates</h1>
          <p className="text-[#6b6b6b] mt-1">Generate and manage course completion certificates</p>
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
              <p className="text-2xl text-[#284342]">{certificates.filter(c => c.status === 'Issued').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <Award size={24} className="text-blue-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Ready to Issue</p>
              <p className="text-2xl text-[#284342]">{certificates.filter(c => c.status === 'Ready').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <Award size={24} className="text-yellow-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Pending</p>
              <p className="text-2xl text-[#284342]">{certificates.filter(c => c.status === 'Pending').length}</p>
            </div>
          </div>
        </div>
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
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-[#f8f8f6] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.certificateNumber}</td>
                  <td className="px-6 py-4 text-sm text-[#284342]">{cert.student}</td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.course}</td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{cert.completionDate}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      cert.grade === 'Distinction' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {cert.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      cert.status === 'Issued' ? 'bg-green-100 text-green-700' :
                      cert.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors" title="Preview">
                        <Eye size={16} className="text-[#284342]" />
                      </button>
                      <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors" title="Download PDF">
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
          <div className="mb-6">
            <Award size={64} className="mx-auto text-[#e9da95]" />
          </div>
          <h1 className="text-4xl text-[#284342] mb-4">Certificate of Completion</h1>
          <div className="w-32 h-1 bg-[#e9da95] mx-auto mb-6"></div>
          <p className="text-lg text-[#6b6b6b] mb-2">This certifies that</p>
          <h2 className="text-3xl text-[#284342] mb-6">Student Name</h2>
          <p className="text-lg text-[#6b6b6b] mb-2">has successfully completed</p>
          <h3 className="text-2xl text-[#284342] mb-8">Professional Makeup Artist Course</h3>
          <div className="flex justify-between items-end mt-12">
            <div>
              <div className="w-48 h-px bg-[#284342] mb-2"></div>
              <p className="text-sm text-[#6b6b6b]">Director Signature</p>
            </div>
            <div>
              <p className="text-lg text-[#284342]">JEP Image Makeup Academy</p>
              <p className="text-sm text-[#6b6b6b] mt-2">Date: June 2, 2026</p>
            </div>
            <div>
              <div className="w-48 h-px bg-[#284342] mb-2"></div>
              <p className="text-sm text-[#6b6b6b]">Instructor Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
