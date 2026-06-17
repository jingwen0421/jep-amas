import { useParams } from 'react-router';
import { Mail, Phone, Calendar, Award, TrendingUp, FileText } from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams();

  const student = {
    id: id || 'S001',
    name: 'Jessica Lim Mei Ling',
    email: 'jessica.lim@email.com',
    phone: '+60 12-345 6789',
    icPassport: '890123-10-1234',
    course: 'Professional Makeup Artist Course',
    batch: 'PMAC-2026-A',
    status: 'Active',
    progress: 75,
    joinDate: '2026-01-15',
    emergencyContact: '+60 12-987 6543',
    emergencyRelation: 'Parent',
    experience: 'Beginner',
    language: 'English',
  };

  const attendanceRecords = [
    { date: '2026-06-02', lesson: 'Bridal Makeup Basics', status: 'Present' },
    { date: '2026-05-30', lesson: 'Skin Preparation Techniques', status: 'Present' },
    { date: '2026-05-28', lesson: 'Color Theory Application', status: 'Late' },
    { date: '2026-05-26', lesson: 'Foundation Matching', status: 'Present' },
  ];

  const paymentHistory = [
    { date: '2026-05-15', amount: 'RM 2,000', type: 'Installment Payment', status: 'Paid' },
    { date: '2026-04-15', amount: 'RM 2,000', type: 'Installment Payment', status: 'Paid' },
    { date: '2026-03-15', amount: 'RM 2,000', type: 'Initial Payment', status: 'Paid' },
  ];

  const portfolioItems = [
    { title: 'Bridal Look Assignment', date: '2026-05-20', score: '92%', status: 'Approved' },
    { title: 'Editorial Makeup Project', date: '2026-04-15', score: '88%', status: 'Approved' },
    { title: 'Natural Glam Tutorial', date: '2026-03-10', score: '85%', status: 'Approved' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-[#284342]">Student Profile</h1>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors">
          Edit Profile
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-[#e9da95] flex items-center justify-center text-[#284342] text-3xl">
            {student.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl text-[#284342]">{student.name}</h2>
              <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                {student.status}
              </span>
            </div>
            <p className="text-[#6b6b6b] mb-4">Student ID: {student.id}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-[#6b6b6b]">
                <Mail size={16} />
                <span className="text-sm">{student.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#6b6b6b]">
                <Phone size={16} />
                <span className="text-sm">{student.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[#6b6b6b]">
                <Calendar size={16} />
                <span className="text-sm">Joined {student.joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6b6b6b]">Course Progress</span>
            <TrendingUp size={20} className="text-[#284342]" />
          </div>
          <p className="text-2xl text-[#284342] mb-1">{student.progress}%</p>
          <div className="w-full h-2 bg-[#e8e7e2] rounded-full overflow-hidden">
            <div className="h-full bg-[#284342] rounded-full" style={{ width: `${student.progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6b6b6b]">Attendance Rate</span>
            <Award size={20} className="text-[#284342]" />
          </div>
          <p className="text-2xl text-[#284342]">95%</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6b6b6b]">Portfolio Items</span>
            <FileText size={20} className="text-[#284342]" />
          </div>
          <p className="text-2xl text-[#284342]">{portfolioItems.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6b6b6b]">Outstanding Balance</span>
            <FileText size={20} className="text-[#d4183d]" />
          </div>
          <p className="text-2xl text-[#d4183d]">RM 2,000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Details */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h3 className="text-lg text-[#284342] mb-4">Course Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#6b6b6b] mb-1">Course</p>
              <p className="text-sm text-[#284342]">{student.course}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b6b6b] mb-1">Batch</p>
              <p className="text-sm text-[#284342]">{student.batch}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b6b6b] mb-1">Experience Level</p>
              <p className="text-sm text-[#284342]">{student.experience}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b6b6b] mb-1">Preferred Language</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#284342]">{student.language}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]">
                  Primary Language
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h3 className="text-lg text-[#284342] mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {attendanceRecords.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#f8f8f6]">
                <div>
                  <p className="text-sm text-[#284342]">{record.lesson}</p>
                  <p className="text-xs text-[#6b6b6b] mt-1">{record.date}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    record.status === 'Present'
                      ? 'bg-green-100 text-green-700'
                      : record.status === 'Late'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h3 className="text-lg text-[#284342] mb-4">Payment History</h3>
          <div className="space-y-3">
            {paymentHistory.map((payment, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#f8f8f6]">
                <div>
                  <p className="text-sm text-[#284342]">{payment.type}</p>
                  <p className="text-xs text-[#6b6b6b] mt-1">{payment.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#284342]">{payment.amount}</p>
                  <span className="text-xs text-green-700">Paid</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h3 className="text-lg text-[#284342] mb-4">Portfolio Submissions</h3>
          <div className="space-y-3">
            {portfolioItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#f8f8f6]">
                <div>
                  <p className="text-sm text-[#284342]">{item.title}</p>
                  <p className="text-xs text-[#6b6b6b] mt-1">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#284342]">{item.score}</p>
                  <span className="text-xs text-green-700">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
