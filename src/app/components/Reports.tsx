import { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const enrollmentTrends = [
  { month: 'Jan', students: 23 },
  { month: 'Feb', students: 28 },
  { month: 'Mar', students: 31 },
  { month: 'Apr', students: 25 },
  { month: 'May', students: 20 },
];

const revenueData = [
  { month: 'Jan', revenue: 35200 },
  { month: 'Feb', revenue: 38900 },
  { month: 'Mar', revenue: 41500 },
  { month: 'Apr', revenue: 39800 },
  { month: 'May', revenue: 42380 },
];

const courseDistribution = [
  { name: 'Makeup Artistry', value: 38, color: '#284342' },
  { name: 'Hair Styling', value: 19, color: '#6b8e8d' },
  { name: 'Skincare', value: 31, color: '#e9da95' },
  { name: 'Nail Art', value: 15, color: '#f4edd4' },
  { name: 'Bridal', value: 24, color: '#1a2f2e' },
];

const attendanceComparison = [
  { day: 'Mon', thisWeek: 89, lastWeek: 86 },
  { day: 'Tue', thisWeek: 85, lastWeek: 82 },
  { day: 'Wed', thisWeek: 92, lastWeek: 88 },
  { day: 'Thu', thisWeek: 87, lastWeek: 84 },
  { day: 'Fri', thisWeek: 84, lastWeek: 86 },
  { day: 'Sat', thisWeek: 90, lastWeek: 89 },
];

export default function Reports() {
  const [reportType, setReportType] = useState('Overview');
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Reports & Analytics</h1>
          <p style={{ color: '#6b6b6b' }}>Comprehensive insights and analytics</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 flex-1"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
          >
            <option>Overview</option>
            <option>Student Performance</option>
            <option>Financial</option>
            <option>Attendance</option>
            <option>Course Analytics</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: '#6b6b6b' }}>Total Students</p>
            <Users className="w-5 h-5" style={{ color: '#284342' }} />
          </div>
          <h2 style={{ color: '#284342' }}>127</h2>
          <div className="flex items-center gap-1 mt-2" style={{ color: '#284342' }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+8 from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: '#6b6b6b' }}>Revenue</p>
            <DollarSign className="w-5 h-5" style={{ color: '#284342' }} />
          </div>
          <h2 style={{ color: '#284342' }}>RM 42,380</h2>
          <div className="flex items-center gap-1 mt-2" style={{ color: '#284342' }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+15% from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: '#6b6b6b' }}>Avg. Attendance</p>
            <Calendar className="w-5 h-5" style={{ color: '#284342' }} />
          </div>
          <h2 style={{ color: '#284342' }}>88%</h2>
          <div className="flex items-center gap-1 mt-2" style={{ color: '#284342' }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+2% from last week</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: '#6b6b6b' }}>Completion Rate</p>
            <FileText className="w-5 h-5" style={{ color: '#284342' }} />
          </div>
          <h2 style={{ color: '#284342' }}>84%</h2>
          <div className="flex items-center gap-1 mt-2" style={{ color: '#284342' }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+4% from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="mb-4" style={{ color: '#284342' }}>Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40, 67, 66, 0.1)" />
              <XAxis dataKey="month" stroke="#6b6b6b" />
              <YAxis stroke="#6b6b6b" />
              <Tooltip />
              <Line type="monotone" dataKey="students" stroke="#284342" strokeWidth={3} dot={{ fill: '#e9da95', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="mb-4" style={{ color: '#284342' }}>Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40, 67, 66, 0.1)" />
              <XAxis dataKey="month" stroke="#6b6b6b" />
              <YAxis stroke="#6b6b6b" />
              <Tooltip />
              <Bar dataKey="revenue" fill="#284342" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="mb-4" style={{ color: '#284342' }}>Course Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {courseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Comparison */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="mb-4" style={{ color: '#284342' }}>Attendance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40, 67, 66, 0.1)" />
              <XAxis dataKey="day" stroke="#6b6b6b" />
              <YAxis stroke="#6b6b6b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="thisWeek" fill="#284342" radius={[8, 8, 0, 0]} name="This Week" />
              <Bar dataKey="lastWeek" fill="#e9da95" radius={[8, 8, 0, 0]} name="Last Week" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="mb-4" style={{ color: '#284342' }}>Recent Reports</h3>
        <div className="space-y-3">
          {[
            { name: 'Financial Report - May 2026', date: '2026-05-30', size: '1.8 MB' },
            { name: 'Student Performance - Q2 2026', date: '2026-05-28', size: '1.4 MB' },
            { name: 'Attendance Report - May 2026', date: '2026-05-25', size: '892 KB' },
            { name: 'Course Completion - May 2026', date: '2026-05-20', size: '2.1 MB' },
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(233, 218, 149, 0.1)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#284342' }}>
                  <FileText className="w-5 h-5" style={{ color: '#e9da95' }} />
                </div>
                <div>
                  <p style={{ color: '#284342' }}>{report.name}</p>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>
                    {report.date} • {report.size}
                  </p>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-90"
                style={{ background: '#284342', color: '#e9da95' }}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
