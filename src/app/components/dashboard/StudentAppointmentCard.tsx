import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarClock, Clock, User, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentStudentId } from '../../utils/studentAccess';

interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  teacher: string;
  purpose: string;
  status: string;
}

export default function StudentAppointmentCard() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);

    const studentId = await getCurrentStudentId();

    if (!studentId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_datetime,
        appointment_status,
        purpose,
        teachers(
          specialization,
          users(full_name)
        )
      `)
      .eq('student_id', studentId)
      .gte('appointment_datetime', today)
      .neq('appointment_status', 'cancelled')
      .order('appointment_datetime', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Failed to fetch student appointments:', error.message);
      setLoading(false);
      return;
    }

    const mapped: AppointmentItem[] = (data || []).map((item: any) => {
      const dateObj = item.appointment_datetime
        ? new Date(item.appointment_datetime)
        : null;

      return {
        id: item.id,
        date: dateObj ? dateObj.toISOString().slice(0, 10) : '-',
        time: dateObj
          ? dateObj.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
        teacher: getTeacherName(item.teachers),
        purpose: item.purpose || 'Consultation',
        status: formatStatus(item.appointment_status),
      };
    });

    setAppointments(mapped);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
      <div className="p-5 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[#e9da95]/20 text-[#284342]">
            <CalendarClock size={22} />
          </div>

          <div>
            <h2 className="text-lg text-[#284342]">My Appointment Calendar</h2>
            <p className="text-sm text-[#6b6b6b]">
              Upcoming consultation schedule
            </p>
          </div>
        </div>

        <Link
          to="/app/appointments/calendar"
          className="text-sm text-[#284342] hover:underline flex items-center gap-1"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="divide-y divide-[rgba(40,67,66,0.1)]">
        {loading && (
          <div className="p-6 text-center text-[#6b6b6b]">
            Loading appointments...
          </div>
        )}

        {!loading && appointments.length === 0 && (
          <div className="p-6 text-center text-[#6b6b6b]">
            No upcoming appointments.
          </div>
        )}

        {!loading &&
          appointments.map((appointment) => (
            <div key={appointment.id} className="p-5 hover:bg-[#f8f8f6]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[#284342]">{appointment.purpose}</h3>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-[#6b6b6b]">
                    <span className="flex items-center gap-2">
                      <CalendarClock size={14} />
                      {appointment.date}
                    </span>

                    <span className="flex items-center gap-2">
                      <Clock size={14} />
                      {appointment.time}
                    </span>

                    <span className="flex items-center gap-2">
                      <User size={14} />
                      {appointment.teacher}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function getTeacherName(teacher: any) {
  if (!teacher) return 'No preference';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;

  const user = Array.isArray(actualTeacher?.users)
    ? actualTeacher.users[0]
    : actualTeacher?.users;

  return user?.full_name || actualTeacher?.specialization || 'No preference';
}

function formatStatus(status: string) {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'confirmed' || normalized === 'approved') {
    return 'Confirmed';
  }

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return 'Cancelled';
  }

  return 'Pending';
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'Confirmed'
      ? 'bg-green-100 text-green-700'
      : status === 'Cancelled'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}