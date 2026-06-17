import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Search, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Appointment {
  id: number;
  studentName: string;
  teacherName: string;
  date: string;
  time: string;
  duration: string;
  purpose: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled';
  avatar: string;
}

const appointmentsData: Appointment[] = [
  {
    id: 1,
    studentName: 'Wong Xiao Ming',
    teacherName: 'Juju Lim',
    date: '2026-06-03',
    time: '10:00 AM',
    duration: '1 hour',
    purpose: 'Makeup Technique Consultation',
    status: 'Confirmed',
    avatar: 'WX',
  },
  {
    id: 2,
    studentName: 'Tan Da Ai',
    teacherName: 'Esther',
    date: '2026-06-03',
    time: '2:00 PM',
    duration: '45 minutes',
    purpose: 'Bridal Portfolio Review',
    status: 'Pending',
    avatar: 'TD',
  },
  {
    id: 3,
    studentName: 'Lee Mei Ling',
    teacherName: 'Wong Yi Feng',
    date: '2026-06-04',
    time: '11:00 AM',
    duration: '1 hour',
    purpose: 'Hair Styling Guidance',
    status: 'Confirmed',
    avatar: 'LM',
  },
  {
    id: 4,
    studentName: 'Kavitha',
    teacherName: 'Pauline Tang',
    date: '2026-06-04',
    time: '3:00 PM',
    duration: '30 minutes',
    purpose: 'Skincare Questions',
    status: 'Completed',
    avatar: 'KV',
  },
  {
    id: 5,
    studentName: 'Farah',
    teacherName: 'Pauline Tang',
    date: '2026-06-05',
    time: '9:00 AM',
    duration: '1 hour',
    purpose: 'Nail Art Technique',
    status: 'Cancelled',
    avatar: 'FR',
  },
];

export default function Appointments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const filteredAppointments = appointmentsData.filter((apt) => {
    const matchesSearch =
      apt.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return { bg: 'rgba(40, 67, 66, 0.1)', text: '#284342' };
      case 'Pending':
        return { bg: 'rgba(233, 218, 149, 0.3)', text: '#284342' };
      case 'Completed':
        return { bg: 'rgba(40, 67, 66, 0.1)', text: '#284342' };
      case 'Cancelled':
        return { bg: 'rgba(212, 24, 61, 0.1)', text: '#d4183d' };
      case 'Rescheduled':
        return { bg: 'rgba(233, 218, 149, 0.3)', text: '#284342' };
      default:
        return { bg: 'rgba(107, 107, 107, 0.1)', text: '#6b6b6b' };
    }
  };

  const pendingCount = appointmentsData.filter((a) => a.status === 'Pending').length;
  const confirmedCount = appointmentsData.filter((a) => a.status === 'Confirmed').length;
  const completedCount = appointmentsData.filter((a) => a.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="mb-4" style={{ color: '#284342' }}>Book Appointment</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block mb-2 text-sm" style={{ color: '#284342' }}>Student Name</label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm" style={{ color: '#284342' }}>Teacher</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
                >
                  <option>Juju Lim</option>
                  <option>Esther</option>
                  <option>Wong Yi Feng</option>
                  <option>Jay</option>
                  <option>Pauline Tang</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm" style={{ color: '#284342' }}>Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm" style={{ color: '#284342' }}>Time</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
                >
                  <option>9:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>2:00 PM</option>
                  <option>3:00 PM</option>
                  <option>4:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm" style={{ color: '#284342' }}>Duration</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
                >
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>1 hour</option>
                  <option>1.5 hours</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm" style={{ color: '#284342' }}>Purpose</label>
                <textarea
                  rows={3}
                  placeholder="Describe the purpose of appointment"
                  className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(40, 67, 66, 0.1)', color: '#284342' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
                style={{ background: '#284342', color: '#e9da95' }}
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Appointments</h1>
          <p style={{ color: '#6b6b6b' }}>Manage student-teacher consultations</p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          <Plus className="w-5 h-5" />
          Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Pending</p>
          <h2 style={{ color: '#284342' }}>{pendingCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Confirmed</p>
          <h2 style={{ color: '#284342' }}>{confirmedCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Completed</p>
          <h2 style={{ color: '#284342' }}>{completedCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Total This Week</p>
          <h2 style={{ color: '#284342' }}>{appointmentsData.length}</h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b6b' }} />
            <input
              type="text"
              placeholder="Search appointments"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Completed</option>
            <option>Cancelled</option>
            <option>Rescheduled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8f7f2', borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Student</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Teacher</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Date & Time</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Duration</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Purpose</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Status</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => {
                const colors = getStatusColor(apt.status);
                return (
                  <tr key={apt.id} style={{ borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: '#284342', color: '#e9da95' }}
                        >
                          <span className="text-sm">{apt.avatar}</span>
                        </div>
                        <span style={{ color: '#284342' }}>{apt.studentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: '#6b6b6b' }}>{apt.teacherName}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" style={{ color: '#6b6b6b' }} />
                          <span className="text-sm" style={{ color: '#284342' }}>{apt.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" style={{ color: '#6b6b6b' }} />
                          <span className="text-sm" style={{ color: '#6b6b6b' }}>{apt.time}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: '#6b6b6b' }}>{apt.duration}</td>
                    <td className="px-6 py-4" style={{ color: '#6b6b6b' }}>{apt.purpose}</td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-md text-sm"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {apt.status === 'Pending' && (
                          <>
                            <button
                              className="p-2 rounded-lg transition-all hover:opacity-80"
                              style={{ background: 'rgba(40, 67, 66, 0.1)', color: '#284342' }}
                              title="Accept"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg transition-all hover:opacity-80"
                              style={{ background: 'rgba(212, 24, 61, 0.1)', color: '#d4183d' }}
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {apt.status === 'Confirmed' && (
                          <button
                            className="px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-90"
                            style={{ background: 'rgba(40, 67, 66, 0.1)', color: '#284342' }}
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
