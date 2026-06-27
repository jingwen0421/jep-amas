import { useEffect, useState } from 'react';
import { CalendarClock, Save, User, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import { notifyAppointmentBooked } from '../../services/systemNotificationService';

interface StudentOption {
  id: string;
  full_name: string;
  email: string;
}

interface TeacherOption {
  id: string;
  name: string;
  specialization: string;
}

export default function TeacherBooking() {
  const currentUser = getCurrentUser();
  const isStudentView = currentUser.role === 'student';

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');

  const [studentProfileFound, setStudentProfileFound] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        setStudentProfileFound(false);
      } else {
        setSelectedStudentId(studentId);
      }
    } else {
      await fetchStudents();
    }

    await fetchTeachers();

    setLoading(false);
  }

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, email')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch students:', error.message);
      return;
    }

    setStudents(data || []);
  }

  async function fetchTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        specialization,
        users(full_name)
      `);

    if (error) {
      console.error('Failed to fetch teachers:', error.message);
      return;
    }

    const mapped: TeacherOption[] = (data || []).map((teacher: any) => ({
      id: teacher.id,
      name: getUserName(teacher.users),
      specialization: teacher.specialization || '-',
    }));

    setTeachers(mapped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let finalStudentId = selectedStudentId;
    let notificationUserId = currentUser.id || '';
    let bookingStudentName = currentUser.name || 'Student';

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        alert('Student profile not found. Please complete student registration first.');
        setSaving(false);
        return;
      }

      finalStudentId = studentId;
      notificationUserId = currentUser.id || '';
      bookingStudentName = currentUser.name || 'Student';
    }

    if (!finalStudentId) {
      alert('Please select a student.');
      setSaving(false);
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      alert('Please select appointment date and time.');
      setSaving(false);
      return;
    }

    if (!isStudentView) {
      const selectedStudent = students.find(
        (student) => student.id === finalStudentId
      );

      bookingStudentName = selectedStudent?.full_name || 'Student';
      notificationUserId = await getUserIdByEmail(selectedStudent?.email || '');
    }

    const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

    const { data: createdAppointment, error } = await supabase
      .from('appointments')
      .insert({
        student_id: finalStudentId,
        teacher_id: selectedTeacherId || null,
        appointment_datetime: appointmentDateTime,
        appointment_status: 'pending',
        purpose: purpose || null,
        remarks: remarks || null,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      alert(`Failed to book appointment: ${error.message}`);
      setSaving(false);
      return;
    }

    await notifyAppointmentBooked(bookingStudentName, appointmentDateTime, {
      userId: notificationUserId || null,
    });

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Appointment Booked',
      module: 'Appointments',
      target_id: createdAppointment?.id || finalStudentId,
      old_data: null,
      new_data: {
        student_id: finalStudentId,
        teacher_id: selectedTeacherId || null,
        appointment_datetime: appointmentDateTime,
        purpose,
        booked_by: currentUser.email,
        role: currentUser.role,
      },
      created_at: new Date().toISOString(),
    });

    alert(
      isStudentView
        ? 'Your appointment request has been submitted.'
        : 'Appointment has been created.'
    );

    setSelectedStudentId(isStudentView ? finalStudentId : '');
    setSelectedTeacherId('');
    setAppointmentDate('');
    setAppointmentTime('');
    setPurpose('');
    setRemarks('');
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
        Loading appointment booking...
      </div>
    );
  }

  if (isStudentView && !studentProfileFound) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[#284342]">
            Teacher Consultation Booking
          </h1>
          <p className="text-[#6b6b6b] mt-1">
            Appointment booking is linked to your student profile.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          Your student profile was not found. Please complete your student
          registration first or wait for admin approval.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          Teacher Consultation Booking
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          {isStudentView
            ? 'Book a consultation appointment for your own student account.'
            : 'Book consultation appointments for students.'}
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-[#e9da95]/20 text-[#284342]">
            <CalendarClock size={22} />
          </div>

          <div>
            <h2 className="text-xl text-[#284342]">Appointment Details</h2>
            <p className="text-sm text-[#6b6b6b]">
              {isStudentView
                ? 'Your student profile will be used automatically.'
                : 'Select student, teacher and appointment time.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isStudentView && (
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Student
              </label>

              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                required
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} - {student.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isStudentView && (
            <div className="p-4 rounded-lg bg-[#f8f8f6] flex items-center gap-3">
              <User size={20} className="text-[#284342]" />
              <div>
                <p className="text-sm text-[#284342]">
                  Booking for: {currentUser.name}
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  {currentUser.email}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Preferred Teacher
            </label>

            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              <option value="">No preference</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} - {teacher.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Date
              </label>

              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Time
              </label>

              <div className="relative">
                <Clock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                />

                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Purpose
            </label>

            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              <option value="">Select Purpose</option>
              <option value="Course Consultation">Course Consultation</option>
              <option value="Portfolio Review">Portfolio Review</option>
              <option value="Makeup Class Discussion">
                Makeup Class Discussion
              </option>
              <option value="Payment Discussion">Payment Discussion</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Remarks
            </label>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              placeholder="Add any notes or request details..."
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Submitting...' : 'Submit Appointment Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

async function getUserIdByEmail(email: string) {
  if (!email) return '';

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) return '';

  return data.id;
}

function getUserName(user: any) {
  if (!user) return 'Unnamed Teacher';
  if (Array.isArray(user)) return user[0]?.full_name || 'Unnamed Teacher';
  return user.full_name || 'Unnamed Teacher';
}