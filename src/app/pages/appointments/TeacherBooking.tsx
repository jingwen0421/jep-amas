import { useEffect, useState } from 'react';
import { Calendar, Clock, User, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  student: string;
  teacher: string;
  date: string;
  time: string;
  duration: string;
  purpose: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

interface TeacherOption {
  id: string;
  specialization: string | null;
  users?: { full_name: string }[] | { full_name: string } | null;
}

interface StudentOption {
  id: string;
  full_name: string;
}

export default function TeacherBooking() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    studentId: '',
    teacherId: '',
    date: '',
    time: '',
    duration: '30',
    purpose: 'Portfolio Review',
    notes: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchTeachers();
    fetchStudents();
  }, []);

  async function fetchAppointments() {
    setLoading(true);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_datetime,
        duration_minutes,
        appointment_status,
        notes,
        students(full_name),
        teachers(
          specialization,
          users(full_name)
        )
      `)
      .order('appointment_datetime', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error.message);
      setLoading(false);
      return;
    }

    const mapped: Appointment[] = (data || []).map((apt: any) => {
      const dateObj = new Date(apt.appointment_datetime);

      return {
        id: apt.id,
        student: getStudentName(apt.students),
        teacher: getTeacherName(apt.teachers),
        date: dateObj.toISOString().slice(0, 10),
        time: dateObj.toTimeString().slice(0, 5),
        duration: `${apt.duration_minutes || 30} mins`,
        purpose: apt.notes || 'Consultation',
        status: mapStatus(apt.appointment_status),
      };
    });

    setAppointments(mapped);
    setLoading(false);
  }

  async function fetchTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        specialization,
        users(full_name)
      `)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching teachers:', error.message);
      return;
    }

    setTeachers((data || []) as unknown as TeacherOption[]);
  }

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error.message);
      return;
    }

    setStudents(data || []);
  }

  async function createAppointment() {
    if (!formData.studentId || !formData.teacherId || !formData.date || !formData.time) {
      alert('Please select student, teacher, date, and time.');
      return;
    }

    const appointmentDateTime = `${formData.date}T${formData.time}:00+08:00`;

    const { error } = await supabase.from('appointments').insert({
      student_id: formData.studentId,
      teacher_id: formData.teacherId,
      appointment_datetime: appointmentDateTime,
      duration_minutes: Number(formData.duration),
      appointment_status: 'pending',
      notes: formData.purpose + (formData.notes ? ` - ${formData.notes}` : ''),
    });

    if (error) {
      alert(`Failed to book appointment: ${error.message}`);
      return;
    }

    setFormData({
      studentId: '',
      teacherId: '',
      date: '',
      time: '',
      duration: '30',
      purpose: 'Portfolio Review',
      notes: '',
    });

    setShowBookingModal(false);
    fetchAppointments();
  }

  async function cancelAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ appointment_status: 'cancelled' })
      .eq('id', id);

    if (error) {
      alert(`Failed to cancel appointment: ${error.message}`);
      return;
    }

    fetchAppointments();
  }

  const upcomingCount = appointments.filter((a) => a.status === 'Confirmed').length;
  const pendingCount = appointments.filter((a) => a.status === 'Pending').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            Teacher Consultation Booking
          </h1>
          <p className="text-[#6b6b6b] mt-1">
            Book one-on-one sessions with teachers
          </p>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Upcoming" value={upcomingCount} color="text-[#284342]" />
        <SummaryCard label="Pending" value={pendingCount} color="text-yellow-700" />
        <SummaryCard label="Completed" value={completedCount} color="text-green-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">My Appointments</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading appointments...
            </div>
          )}

          {!loading && appointments.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No appointments found.
            </div>
          )}

          {!loading &&
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 hover:bg-[#f8f8f6] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-[#284342]">
                        {appointment.purpose}
                      </h3>

                      <StatusBadge status={appointment.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <Info icon={<User size={14} />} label="Student" value={appointment.student} />
                      <Info icon={<User size={14} />} label="Teacher" value={appointment.teacher} />
                      <Info icon={<Calendar size={14} />} label="Date" value={appointment.date} />
                      <Info icon={<Clock size={14} />} label="Time" value={appointment.time} />
                      <Info icon={<Clock size={14} />} label="Duration" value={appointment.duration} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  {(appointment.status === 'Confirmed' || appointment.status === 'Pending') && (
                    <button
                      onClick={() => cancelAppointment(appointment.id)}
                      className="px-4 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}

                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              Book Teacher Consultation
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Student
                </label>

                <select
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      studentId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Select Teacher
                </label>

                <select
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      teacherId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {getTeacherName(teacher)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, date: value }))
                  }
                />

                <Input
                  label="Time"
                  type="time"
                  value={formData.time}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, time: value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Duration
                </label>

                <select
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Purpose
                </label>

                <select
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purpose: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option>Portfolio Review</option>
                  <option>Technique Guidance</option>
                  <option>Career Advice</option>
                  <option>Course Progress Discussion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Additional Notes
                </label>

                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  placeholder="Any specific topics you'd like to discuss..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={createAppointment}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapStatus(status: string): Appointment['status'] {
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getTeacherName(teacher: any) {
  if (!teacher) return 'Unnamed Teacher';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;
  const user = Array.isArray(actualTeacher?.users)
    ? actualTeacher.users[0]
    : actualTeacher?.users;

  return user?.full_name || actualTeacher?.specialization || 'Unnamed Teacher';
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const className =
    status === 'Confirmed'
      ? 'bg-green-100 text-green-700'
      : status === 'Pending'
      ? 'bg-yellow-100 text-yellow-700'
      : status === 'Completed'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[#6b6b6b] mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-[#284342]">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
      />
    </div>
  );
}