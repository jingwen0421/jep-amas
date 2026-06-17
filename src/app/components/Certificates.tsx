import { useState } from 'react';
import { Search, Award, Download, Eye, CheckCircle } from 'lucide-react';

const certificatesData = [
  {
    id: 1,
    studentName: 'Kavitha A/P Devi',
    course: 'Skincare & Facial',
    issueDate: '2026-05-18',
    certificateNumber: 'BA-2026-047',
    grade: 'A',
    status: 'Issued',
    avatar: 'KD',
  },
  {
    id: 2,
    studentName: 'Nur Aisyah Binti Ahmad',
    course: 'Makeup Artistry',
    issueDate: '2026-05-22',
    certificateNumber: 'BA-2026-048',
    grade: 'A',
    status: 'Issued',
    avatar: 'NA',
  },
  {
    id: 3,
    studentName: 'Siti Nurhaliza Binti Rosli',
    course: 'Bridal Makeup',
    issueDate: 'In Progress',
    certificateNumber: '-',
    grade: 'B+',
    status: 'Pending',
    avatar: 'SN',
  },
  {
    id: 4,
    studentName: 'Lee Mei Ling',
    course: 'Hair Styling',
    issueDate: 'In Progress',
    certificateNumber: '-',
    grade: 'B',
    status: 'Pending',
    avatar: 'LM',
  },
];

export default function Certificates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState<number | null>(null);

  const filteredCertificates = certificatesData.filter((cert) =>
    cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const issuedCount = certificatesData.filter((c) => c.status === 'Issued').length;
  const pendingCount = certificatesData.filter((c) => c.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Certificate Management</h1>
          <p style={{ color: '#6b6b6b' }}>Issue and manage student certificates</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          <Award className="w-5 h-5" />
          Generate Certificate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: '#6b6b6b' }}>Total Certificates</p>
            <Award className="w-5 h-5" style={{ color: '#284342' }} />
          </div>
          <h2 style={{ color: '#284342' }}>{certificatesData.length}</h2>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: '#6b6b6b' }}>Issued</p>
            <CheckCircle className="w-5 h-5" style={{ color: '#284342' }} />
          </div>
          <h2 style={{ color: '#284342' }}>{issuedCount}</h2>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p style={{ color: '#6b6b6b' }}>Pending</p>
          <h2 style={{ color: '#284342' }}>{pendingCount}</h2>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6b6b6b' }} />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
          />
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCertificates.map((cert) => (
          <div key={cert.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Certificate Preview */}
            <div
              className="h-48 p-6 flex flex-col items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, rgba(40, 67, 66, 0.9) 0%, rgba(40, 67, 66, 0.7) 100%)`,
              }}
            >
              <div className="absolute inset-0 opacity-10" style={{
                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(233, 218, 149, 0.3) 10px, rgba(233, 218, 149, 0.3) 20px)'
              }} />

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#e9da95' }}>
                  <Award className="w-8 h-8" style={{ color: '#284342' }} />
                </div>
                <h3 className="mb-2" style={{ color: '#e9da95' }}>Certificate of Completion</h3>
                <p className="text-sm" style={{ color: 'rgba(233, 218, 149, 0.8)' }}>Beauty Academy</p>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: '#284342', color: '#e9da95' }}
                  >
                    {cert.avatar}
                  </div>
                  <div>
                    <p style={{ color: '#284342' }}>{cert.studentName}</p>
                    <p className="text-sm" style={{ color: '#6b6b6b' }}>{cert.course}</p>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    background: cert.status === 'Issued' ? 'rgba(40, 67, 66, 0.1)' : 'rgba(233, 218, 149, 0.3)',
                    color: '#284342',
                  }}
                >
                  {cert.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#6b6b6b' }}>Certificate Number</p>
                  <p style={{ color: '#284342' }}>{cert.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#6b6b6b' }}>Issue Date</p>
                  <p style={{ color: '#284342' }}>{cert.issueDate}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#6b6b6b' }}>Grade</p>
                  <p style={{ color: '#284342' }}>{cert.grade}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-90"
                  style={{ background: '#284342', color: '#e9da95' }}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-90"
                  style={{ background: 'rgba(40, 67, 66, 0.1)', color: '#284342' }}
                  disabled={cert.status === 'Pending'}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
