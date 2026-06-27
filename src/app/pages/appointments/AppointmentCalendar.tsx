import { useEffect, useState } from 'react';
import {
  User,
  Clock,
  CalendarClock,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import { supabase } from '../../lib/supabase';
import {
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
} from '../../services/systemNotificationService';

interface CalendarAppointment {
  id: string;
  studentId: string;
  studentUserId: string;
  teacherId: string;
  date: string;
  student: string;
  teacher: string;
  time: string;
  purpose: string;
  remarks: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export default function AppointmentCalendar() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = getCurrentUser();
  const isStudentView = currentUser.role === 'student';

  const canManageAppointments =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'teacher';

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);

    let query = supabase
      .from('appointments')
      .select(`
        id,
        student_id,
        teacher_id,
        appointment_datetime,
        appointment_status,
        purpose,
        remarks,
        students(full_name, email, user_id),
        teachers(
          specialization,
          users(full_name)
        )
      `)
      .order('appointment_datetime', { ascending: true });

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch appointments:', error.message);
      setLoading(false);
      return;
    }

    const mapped: CalendarAppointment[] = (data || []).map((item: any) => {
      const appointmentDate = item.appointment_datetime
        ? new Date(item.appointment_datetime)
        : null;

      return {
        id: item.id,
        studentId: item.student_id || '',
        studentUserId: getStudentUserId(item.students),
        teacherId: item.teacher_id || '',
        date: appointmentDate
          ? appointmentDate.toISOString().slice(0, 10)
          : '-',
        time: appointmentDate
          ? appointmentDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
        student: getStudentName(item.students),
        teacher: getTeacherNameFromJoin(item.teachers),
        purpose: item.purpose || 'Consultation',
        remarks: item.remarks || '-',
        status: formatStatus(item.appointment_status),
      };
    });

    setAppointments(mapped);
    setLoading(false);
  }

  async function updateAppointmentStatus(
    appointmentId: string,
    status: 'confirmed' | 'cancelled'
  ) {
    const appointment = appointments.find((item) => item.id === appointmentId);

    const confirmMessage =
      status === 'confirmed'
        ? 'Confirm this appointment?'
        : 'Cancel this appointment?';

    if (!confirm(confirmMessage)) return;

    const { error } = await supabase
      .from('appointments')
      .update({
        appointment_status: status,
      })
      .eq('id', appointmentId);

    if (error) {
      alert(`Failed to update appointment: ${error.message}`);
      return;
    }

    if (appointment?.studentUserId) {
      const appointmentDateTime = `${appointment.date} ${appointment.time}`;

      if (status === 'confirmed') {
        await notifyAppointmentConfirmed(appointmentDateTime, {
          userId: appointment.studentUserId,
        });
      }

      if (status === 'cancelled') {
        await notifyAppointmentCancelled(appointmentDateTime, {
          userId: appointment.studentUserId,
        });
      }
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action:
        status === 'confirmed'
          ? 'Appointment Confirmed'
          : 'Appointment Cancelled',
      module: 'Appointments',
      target_id: appointmentId,
      old_data: null,
      new_data: {
        appointment_status: status,
        student: appointment?.student || null,
        appointment_datetime: appointment
          ? `${appointment.date} ${appointment.time}`
          : null,
        updated_by: currentUser.email,
        role: currentUser.role,
      },
      created_at: new Date().toISOString(),
    });

    fetchAppointments();
  }

  async function cancelOwnAppointment(appointmentId: string) {
    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!confirm('Cancel your appointment request?')) return;

    const { error } = await supabase
      .from('appointments')
      .update({
        appointment_status: 'cancelled',
      })
      .eq('id', appointmentId);

    if (error) {
      alert(`Failed to cancel appointment: ${error.message}`);
      return;
    }

    if (appointment?.studentUserId) {
      await notifyAppointmentCancelled(`${appointment.date} ${appointment.time}`, {
        userId: appointment.studentUserId,
      });
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Student Cancelled Appointment',
      module: 'Appointments',
      target_id: appointmentId,
      old_data: null,
      new_data: {
        appointment_status: 'cancelled',
        appointment_datetime: appointment
          ? `${appointment.date} ${appointment.time}`
          : null,
        cancelled_by: currentUser.email,
        role: currentUser.role,
      },
      created_at: new Date().toISOString(),
    });

    fetchAppointments();
  }

  const today = new Date().toISOString().slice(0, 10);

  const upcomingAppointments = appointments.filter(
    (appointment) =>
      appointment.date >= today && appointment.status !== 'Cancelled'
  );

  const todayAppointments = appointments.filter(
    (appointment) =>
      appointment.date === today && appointment.status !== 'Cancelled'
  );

  const pendingCount = appointments.filter(
    (appointment) => appointment.status === 'Pending'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Appointment Calendar</h1>
        <p className="text-[#6b6b6b] mt-1">
          {isStudentView
            ? 'View your own appointment requests and consultation schedule.'
            : 'Overview of scheduled student consultations and appointment requests.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          label="Today's Appointments"
          value={todayAppointments.length}
          color="text-[#284342]"
        />

        <SummaryCard
          label="Upcoming"
          value={upcomingAppointments.length}
          color="text-blue-700"
        />

        <SummaryCard
          label="Pending Confirmation"
          value={pendingCount}
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
            todayAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isStudentView={isStudentView}
                canManageAppointments={canManageAppointments}
                onConfirm={() =>
                  updateAppointmentStatus(appointment.id, 'confirmed')
                }
                onCancel={() =>
                  canManageAppointments
                    ? updateAppointmentStatus(appointment.id, 'cancelled')
                    : cancelOwnAppointment(appointment.id)
                }
              />
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            {isStudentView
              ? 'My Upcoming Appointments'
              : 'Upcoming Appointments'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Time
                </th>

                {!isStudentView && (
                  <th className="px-6 py-4 text-left text-sm text-[#284342]">
                    Student
                  </th>
                )}

                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Teacher
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Purpose
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td
                    colSpan={isStudentView ? 6 : 7}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    Loading appointments...
                  </td>
                </tr>
              )}

              {!loading && upcomingAppointments.length === 0 && (
                <tr>
                  <td
                    colSpan={isStudentView ? 6 : 7}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    No upcoming appointments.
                  </td>
                </tr>
              )}

              {!loading &&
                upcomingAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="hover:bg-[#f8f8f6] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {appointment.date}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {appointment.time}
                    </td>

                    {!isStudentView && (
                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {appointment.student}
                      </td>
                    )}

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {appointment.teacher}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {appointment.purpose}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>

                    <td className="px-6 py-4">
                      <ActionButtons
                        appointment={appointment}
                        isStudentView={isStudentView}
                        canManageAppointments={canManageAppointments}
                        onConfirm={() =>
                          updateAppointmentStatus(appointment.id, 'confirmed')
                        }
                        onCancel={() =>
                          canManageAppointments
                            ? updateAppointmentStatus(
                                appointment.id,
                                'cancelled'
                              )
                            : cancelOwnAppointment(appointment.id)
                        }
                      />
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

function AppointmentCard({
  appointment,
  isStudentView,
  canManageAppointments,
  onConfirm,
  onCancel,
}: {
  appointment: CalendarAppointment;
  isStudentView: boolean;
  canManageAppointments: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-6 hover:bg-[#f8f8f6] transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg text-[#284342]">{appointment.purpose}</h3>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-[#6b6b6b]">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              {appointment.time}
            </div>

            {!isStudentView && (
              <div className="flex items-center gap-2">
                <User size={14} />
                {appointment.student}
              </div>
            )}

            <div className="flex items-center gap-2">
              <User size={14} />
              Teacher: {appointment.teacher}
            </div>

            {appointment.remarks !== '-' && (
              <div className="flex items-center gap-2">
                <CalendarClock size={14} />
                {appointment.remarks}
              </div>
            )}
          </div>
        </div>

        <ActionButtons
          appointment={appointment}
          isStudentView={isStudentView}
          canManageAppointments={canManageAppointments}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

function ActionButtons({
  appointment,
  isStudentView,
  canManageAppointments,
  onConfirm,
  onCancel,
}: {
  appointment: CalendarAppointment;
  isStudentView: boolean;
  canManageAppointments: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const canStudentCancel =
    isStudentView && appointment.status === 'Pending';

  if (!canManageAppointments && !canStudentCancel) {
    return <span className="text-xs text-[#6b6b6b]">No action</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {canManageAppointments && appointment.status === 'Pending' && (
        <button
          onClick={onConfirm}
          className="p-2 rounded-lg hover:bg-green-50"
          title="Confirm Appointment"
        >
          <CheckCircle2 size={17} className="text-green-700" />
        </button>
      )}

      {(canManageAppointments || canStudentCancel) && (
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-red-50"
          title="Cancel Appointment"
        >
          <XCircle size={17} className="text-red-700" />
        </button>
      )}
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

function StatusBadge({
  status,
}: {
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}) {
  const styles =
    status === 'Confirmed'
      ? 'bg-green-100 text-green-700'
      : status === 'Cancelled'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${styles}`}>
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

function formatStatus(status: string): 'Confirmed' | 'Pending' | 'Cancelled' {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'confirmed' || normalized === 'approved') {
    return 'Confirmed';
  }

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return 'Cancelled';
  }

  return 'Pending';
}

function getStudentUserId(student: any) {
  if (!student) return '';
  if (Array.isArray(student)) return student[0]?.user_id || '';
  return student.user_id || '';
}