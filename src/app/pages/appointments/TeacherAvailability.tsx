import { useEffect, useState } from 'react';
import { Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  available: boolean;
}

interface TeacherSchedule {
  teacher: string;
  slots: TimeSlot[];
}

export default function TeacherAvailability() {
  const [teachers, setTeachers] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    setLoading(true);

    const { data, error } = await supabase
      .from('teacher_availability')
      .select(`
        id,
        available_date,
        start_time,
        end_time,
        status,
        teachers(
          specialization,
          users(full_name)
        )
      `)
      .order('available_date', { ascending: true });

    if (error) {
      console.error('Error fetching teacher availability:', error.message);
      setLoading(false);
      return;
    }

    const grouped: Record<string, TimeSlot[]> = {};

    (data || []).forEach((slot: any) => {
      const teacherName = getTeacherName(slot.teachers);
      const date = new Date(slot.available_date);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (!grouped[teacherName]) grouped[teacherName] = [];

      grouped[teacherName].push({
        id: slot.id,
        day,
        time: `${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}`,
        available: slot.status === 'active',
      });
    });

    setTeachers(
      Object.entries(grouped).map(([teacher, slots]) => ({
        teacher,
        slots,
      }))
    );

    setLoading(false);
  }

  const totalTeachers = teachers.length;

  const availableSlots = teachers.reduce(
    (acc, teacher) => acc + teacher.slots.filter((slot) => slot.available).length,
    0
  );

  const bookedSlots = teachers.reduce(
    (acc, teacher) => acc + teacher.slots.filter((slot) => !slot.available).length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Teacher Availability</h1>
        <p className="text-[#6b6b6b] mt-1">
          View consultation time slots for all teachers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Total Teachers" value={totalTeachers} color="text-[#284342]" />
        <SummaryCard label="Available Slots" value={availableSlots} color="text-green-700" />
        <SummaryCard label="Booked Slots" value={bookedSlots} color="text-red-700" />
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            Loading teacher availability...
          </div>
        )}

        {!loading && teachers.length === 0 && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            No teacher availability found.
          </div>
        )}

        {!loading &&
          teachers.map((teacherSchedule) => (
            <div
              key={teacherSchedule.teacher}
              className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden"
            >
              <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
                <h2 className="text-lg text-[#284342]">
                  {teacherSchedule.teacher}
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teacherSchedule.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-lg border ${
                        slot.available
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-[#284342]" />
                          <span className="text-sm text-[#284342]">
                            {slot.day}
                          </span>
                        </div>

                        {slot.available ? (
                          <CheckCircle2 size={16} className="text-green-700" />
                        ) : (
                          <XCircle size={16} className="text-red-700" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-[#6b6b6b]" />
                        <span className="text-sm text-[#6b6b6b]">
                          {slot.time}
                        </span>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full inline-block ${
                          slot.available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {slot.available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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

function getTeacherName(teacher: any) {
  if (!teacher) return 'Unnamed Teacher';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;
  const user = Array.isArray(actualTeacher?.users)
    ? actualTeacher.users[0]
    : actualTeacher?.users;

  return user?.full_name || actualTeacher?.specialization || 'Unnamed Teacher';
}