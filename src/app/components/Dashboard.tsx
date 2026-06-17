import { Users, BookOpen, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const statsData = [
  { icon: Users, label: 'Total Active Students', value: '127', change: '+8 new this month' },
  { icon: DollarSign, label: 'Outstanding Payments', value: 'RM 8,650', change: '12 students' },
  { icon: Calendar, label: 'Upcoming Classes', value: '18', change: 'This week' },
  { icon: TrendingUp, label: 'Attendance Rate', value: '88%', change: '+2% this week' },
];

const attendanceData = [
  { day: 'Mon', attendance: 92 },
  { day: 'Tue', attendance: 88 },
  { day: 'Wed', attendance: 95 },
  { day: 'Thu', attendance: 90 },
  { day: 'Fri', attendance: 87 },
  { day: 'Sat', attendance: 93 },
];

const enrollmentData = [
  { month: 'Jan', students: 45 },
  { month: 'Feb', students: 52 },
  { month: 'Mar', students: 48 },
  { month: 'Apr', students: 61 },
  { month: 'May', students: 55 },
  { month: 'Jun', students: 68 },
];

const recentStudents = [
  { name: 'Wong Xiao Ming', course: 'Makeup Artistry', enrollDate: '2026-05-28', avatar: 'WX' },
  { name: 'Tan Da Ai', course: 'Bridal Makeup', enrollDate: '2026-05-25', avatar: 'TD' },
  { name: 'Lee Mei Ling', course: 'Hair Styling', enrollDate: '2026-05-22', avatar: 'LM' },
  { name: 'Kavitha', course: 'Skincare & Facial', enrollDate: '2026-05-20', avatar: 'KV' },
];

const upcomingClasses = [
  { title: 'Bridal Makeup Workshop', time: 'Today, 10:00 AM', instructor: 'Juju Lim', room: 'Studio A' },
  { title: 'Hair Styling Basics', time: 'Today, 2:00 PM', instructor: 'Wong Yee Feng', room: 'Studio C' },
  { title: 'Skincare Theory', time: 'Tomorrow, 9:00 AM', instructor: 'Jay', room: 'Room 101' },
];

const paymentsDueThisWeek = [
  { name: 'Wong Xiao Ming', amount: 'RM 1,300', dueDate: 'Jun 5', avatar: 'WX' },
  { name: 'Lee Mei Ling', amount: 'RM 1,650', dueDate: 'Jun 6', avatar: 'LM' },
  { name: 'Tan Da Ai', amount: 'RM 950', dueDate: 'Jun 7', avatar: 'TD' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Dashboard</h1>
          <p style={{ color: '#6b6b6b' }}>Welcome back! Here's what's happening today.</p>
        </div>
        <button
          className="px-6 py-3 rounded-xl transition-all hover:opacity-90 w-full sm:w-auto"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          Generate Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#f8f8f6' }}>
                  <Icon className="w-5 h-5" style={{ color: '#284342' }} />
                </div>
              </div>
              <h3 className="mb-1" style={{ color: '#284342' }}>{stat.value}</h3>
              <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>{stat.label}</p>
              <p className="text-xs" style={{ color: '#6b6b6b' }}>{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <h3 className="mb-4" style={{ color: '#284342' }}>Weekly Attendance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40, 67, 66, 0.1)" />
              <XAxis dataKey="day" stroke="#6b6b6b" />
              <YAxis stroke="#6b6b6b" />
              <Tooltip />
              <Bar dataKey="attendance" fill="#284342" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Enrollment Trends */}
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <h3 className="mb-4" style={{ color: '#284342' }}>Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40, 67, 66, 0.1)" />
              <XAxis dataKey="month" stroke="#6b6b6b" />
              <YAxis stroke="#6b6b6b" />
              <Tooltip />
              <Line type="monotone" dataKey="students" stroke="#284342" strokeWidth={3} dot={{ fill: '#e9da95', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Student Registrations */}
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <h3 className="mb-4" style={{ color: '#284342' }}>Recent Student Registrations</h3>
          <div className="space-y-4">
            {recentStudents.map((student) => (
              <div key={student.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: '#284342', color: '#e9da95' }}
                  >
                    <span className="text-sm">{student.avatar}</span>
                  </div>
                  <div>
                    <p style={{ color: '#284342' }}>{student.name}</p>
                    <p className="text-sm" style={{ color: '#6b6b6b' }}>{student.course}</p>
                  </div>
                </div>
                <span className="text-sm" style={{ color: '#6b6b6b' }}>{student.enrollDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Classes */}
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: '#284342' }}>Today's Classes</h3>
            <button
              onClick={() => navigate('/classes')}
              className="text-sm hover:underline"
              style={{ color: '#284342' }}
            >
              View Calendar
            </button>
          </div>
          <div className="space-y-4">
            {upcomingClasses.map((cls) => (
              <div key={cls.title} className="p-4 rounded-lg border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
                <div className="flex items-start justify-between mb-2">
                  <h4 style={{ color: '#284342' }}>{cls.title}</h4>
                </div>
                <p className="text-sm mb-1" style={{ color: '#6b6b6b' }}>{cls.time}</p>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#6b6b6b' }}>Instructor: {cls.instructor}</span>
                  <span style={{ color: '#6b6b6b' }}>{cls.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Due This Week */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: '#284342' }}>Payment Due This Week</h3>
          <button
            onClick={() => navigate('/payment-tracking')}
            className="text-sm hover:underline"
            style={{ color: '#284342' }}
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentsDueThisWeek.map((payment) => (
            <div key={payment.name} className="p-4 rounded-lg border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: '#284342', color: '#e9da95' }}
                >
                  <span className="text-sm">{payment.avatar}</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: '#284342' }}>{payment.name}</p>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>Due: {payment.dueDate}</p>
                </div>
              </div>
              <p className="text-lg" style={{ color: '#d4183d' }}>{payment.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
