import { useEffect, useState } from 'react';
import { User, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CalendarAppointment {
  id: string;
  date: string;
  student: string;
  teacher: string;
  time: string;
  purpose: string;
  status: 'Confirmed' | 'Pending';
}

export default function AppointmentCalendar() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_datetime,
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

    const mapped: CalendarAppointment[] = (data || []).map((apt: any) => {
      const dateObj = new Date(apt.appointment_datetime);

      return {
        id: apt.id,
        date: dateObj.toISOString().slice(0, 10),
        time: dateObj.toTimeString().slice(0, 5),
        student: getStudentName(apt.students),
        teacher: getTeacherNameFromJoin(apt.teachers),
        purpose: apt.notes || 'Consultation',
        status:
          apt.appointment_status === 'confirmed'
            ? 'Confirmed'
            : 'Pending',
      };
    });

    setAppointments(mapped);
    setLoading(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  const upcomingAppointments = appointments.filter((a) => a.date >= today);
  const todayAppointments = appointments.filter((a) => a.date === today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Appointment Calendar</h1>
        <p className="text-[#6b6b6b] mt-1">
          Overview of all scheduled consultations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Today's Appointments" value={todayAppointments.length} color="text-[#284342]" />
        <SummaryCard label="Upcoming" value={upcomingAppointments.length} color="text-blue-700" />
        <SummaryCard
          label="Pending Confirmation"
          value={appointments.filter((a) => a.status === 'Pending').length}
          color="text-yellow-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            Today's Appointments - {today}
          </h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading appointments...
            </div>
          )}

          {!loading && todayAppointments.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No appointments today.
            </div>
          )}

          {!loading &&
            todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-6 hover:bg-[#f8f8f6] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-[#284342]">{apt.purpose}</h3>

                      <StatusBadge status={apt.status} />
                    </div>

                    <div className="flex items-center gap-6 text-sm text-[#6b6b6b]">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {apt.time}
                      </div>

                      <div className="flex items-center gap-2">
                        <User size={14} />
                        {apt.student}
                      </div>

                      <div className="flex items-center gap-2">
                        <User size={14} />
                        Teacher: {apt.teacher}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Upcoming Appointments</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Date</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Time</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Student</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Teacher</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Purpose</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading appointments...
                  </td>
                </tr>
              )}

              {!loading && upcomingAppointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No upcoming appointments.
                  </td>
                </tr>
              )}

              {!loading &&
                upcomingAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-[#f8f8f6] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {apt.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {apt.time}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {apt.student}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {apt.teacher}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {apt.purpose}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={apt.status} />
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

function StatusBadge({ status }: { status: 'Confirmed' | 'Pending' }) {
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full ${
        status === 'Confirmed'
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {status}
    </span>
  );
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getTeacherNameFromJoin(teacher: any) {
  if (!teacher) return '-';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;
  const user = Array.isArray(actualTeacher?.users)
    ? actualTeacher.users[0]
    : actualTeacher?.users;

  return user?.full_name || actualTeacher?.specialization || '-';
}