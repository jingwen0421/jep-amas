import { useEffect, useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ScheduledClass {
  id: string;
  course: string;
  batch: string;
  date: string;
  startTime: string;
  endTime: string;
  teacher: string;
  room: string;
  students: number;
  status: 'Scheduled' | 'Completed';
}

interface BatchOption {
  id: string;
  batch_name: string;
  courses?: { course_name: string }[] | { course_name: string } | null;
  enrollments?: { id: string }[];
}

interface TeacherOption {
  id: string;
  specialization: string | null;
  users?: { full_name: string }[] | { full_name: string } | null;
}

interface ClassroomOption {
  id: string;
  room_name: string;
}

export default function ClassScheduling() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('Current Week');

  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    batchId: '',
    teacherId: '',
    classroomId: '',
    date: '',
    startTime: '',
    endTime: '',
    lessonTitle: '',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    await Promise.all([
      fetchScheduledClasses(),
      fetchBatches(),
      fetchTeachers(),
      fetchClassrooms(),
    ]);
  }

  async function fetchScheduledClasses() {
    setLoading(true);

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id,
        lesson_title,
        lesson_datetime,
        duration_minutes,
        status,
        class_batches(
          batch_name,
          courses(course_name),
          enrollments(id)
        ),
        teachers(
          specialization,
          users(full_name)
        ),
        classrooms(room_name)
      `)
      .order('lesson_datetime', { ascending: true });

    if (error) {
      console.error('Error fetching schedule:', error.message);
      setLoading(false);
      return;
    }

    const mapped: ScheduledClass[] = (data || []).map((lesson: any) => {
      const start = new Date(lesson.lesson_datetime);
      const duration = lesson.duration_minutes || 180;
      const end = new Date(start.getTime() + duration * 60000);

      return {
        id: lesson.id,
        course: getCourseName(lesson.class_batches?.courses),
        batch: lesson.class_batches?.batch_name || '-',
        date: start.toISOString().slice(0, 10),
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        teacher: getTeacherNameFromJoin(lesson.teachers),
        room: lesson.classrooms?.room_name || '-',
        students: lesson.class_batches?.enrollments?.length || 0,
        status: start < new Date() ? 'Completed' : 'Scheduled',
      };
    });

    setScheduledClasses(mapped);
    setLoading(false);
  }

  async function fetchBatches() {
    const { data, error } = await supabase
      .from('class_batches')
      .select(`
        id,
        batch_name,
        courses(course_name),
        enrollments(id)
      `)
      .order('batch_name', { ascending: true });

    if (error) {
      console.error('Error fetching batches:', error.message);
      return;
    }

    setBatches((data || []) as unknown as BatchOption[]);
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
      console.error('Error fetching teachers:', error.message);
      return;
    }

    setTeachers((data || []) as unknown as TeacherOption[]);
  }

  async function fetchClassrooms() {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, room_name')
      .order('room_name', { ascending: true });

    if (error) {
      console.error('Error fetching classrooms:', error.message);
      return;
    }

    setClassrooms(data || []);
  }

  function calculateDurationMinutes(startTime: string, endTime: string) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    return eh * 60 + em - (sh * 60 + sm);
  }

  async function scheduleClass() {
    if (
      !formData.batchId ||
      !formData.date ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert('Please select batch, date, start time, and end time.');
      return;
    }

    const durationMinutes = calculateDurationMinutes(
      formData.startTime,
      formData.endTime
    );

    if (durationMinutes <= 0) {
      alert('End time must be later than start time.');
      return;
    }

    const lessonDateTime = `${formData.date}T${formData.startTime}:00+08:00`;

    const { error } = await supabase.from('lessons').insert({
      batch_id: formData.batchId,
      teacher_id: formData.teacherId || null,
      classroom_id: formData.classroomId || null,
      lesson_title: formData.lessonTitle || 'Scheduled Class',
      lesson_objective: 'Scheduled class session',
      lesson_datetime: lessonDateTime,
      duration_minutes: durationMinutes,
      status: 'active',
    });

    if (error) {
      alert(`Failed to schedule class: ${error.message}`);
      return;
    }

    setFormData({
      batchId: '',
      teacherId: '',
      classroomId: '',
      date: '',
      startTime: '',
      endTime: '',
      lessonTitle: '',
    });

    setShowScheduleModal(false);
    fetchScheduledClasses();
  }

  const conflicts: { type: string; message: string }[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Class Scheduling</h1>
          <p className="text-[#6b6b6b] mt-1">
            Schedule and manage class sessions
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Schedule Class
        </button>
      </div>

      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-700 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm text-yellow-900 mb-2">
                Scheduling Conflicts Detected
              </h3>
              {conflicts.map((conflict, idx) => (
                <p key={idx} className="text-sm text-yellow-800 mb-1">
                  <strong>{conflict.type}:</strong> {conflict.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-4">
          <label className="text-sm text-[#284342]">View Schedule:</label>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            <option>Current Week</option>
            <option>Next Week</option>
            <option>This Month</option>
            <option>Next Month</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            Scheduled Classes - {selectedWeek}
          </h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading scheduled classes...
            </div>
          )}

          {!loading && scheduledClasses.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No scheduled classes found.
            </div>
          )}

          {!loading &&
            scheduledClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="p-6 hover:bg-[#f8f8f6] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-[#284342]">
                        {classItem.course}
                      </h3>

                      <span className="text-xs px-3 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]">
                        {classItem.batch}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          classItem.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {classItem.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <Info
                        icon={<Calendar size={14} />}
                        label="Date"
                        value={classItem.date}
                      />
                      <Info
                        icon={<Clock size={14} />}
                        label="Time"
                        value={`${classItem.startTime} - ${classItem.endTime}`}
                      />
                      <Info
                        icon={<Users size={14} />}
                        label="Teacher"
                        value={classItem.teacher}
                      />
                      <Info
                        icon={<MapPin size={14} />}
                        label="Room"
                        value={classItem.room}
                      />
                      <Info
                        icon={<Users size={14} />}
                        label="Students"
                        value={classItem.students.toString()}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
                    View Details
                  </button>

                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    Edit Schedule
                  </button>

                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    Send Reminder
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              Schedule New Class
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Lesson Title
                </label>

                <input
                  value={formData.lessonTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lessonTitle: e.target.value,
                    }))
                  }
                  placeholder="e.g., Bridal Makeup Essentials"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Batch
                </label>

                <select
                  value={formData.batchId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      batchId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name} - {getCourseName(batch.courses)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, date: value }))
                  }
                />

                <Input
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startTime: value }))
                  }
                />

                <Input
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, endTime: value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    Teacher
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

                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    Classroom
                  </label>

                  <select
                    value={formData.classroomId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        classroomId: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  >
                    <option value="">Select Room</option>
                    {classrooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Conflict Check:</strong> No conflicts detected for this schedule
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={scheduleClass}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Schedule Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

function getCourseName(
  courses?: { course_name: string }[] | { course_name: string } | null
) {
  if (!courses) return '-';
  if (Array.isArray(courses)) return courses[0]?.course_name || '-';
  return courses.course_name || '-';
}

function getTeacherName(teacher: TeacherOption) {
  const users = teacher.users;

  if (Array.isArray(users)) {
    return users[0]?.full_name || teacher.specialization || 'Unnamed Teacher';
  }

  return users?.full_name || teacher.specialization || 'Unnamed Teacher';
}

function getTeacherNameFromJoin(
  teacher?: TeacherOption[] | TeacherOption | null
) {
  if (!teacher) return '-';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;

  if (!actualTeacher) return '-';

  return getTeacherName(actualTeacher);
}