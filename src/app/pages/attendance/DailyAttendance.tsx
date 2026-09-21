import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Coffee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave';

interface Student {
  id: string;
  dbId: string;
  name: string;
  batch: string;
  status: AttendanceStatus | null;
}

interface LessonOption {
  id: string;
  rawTitle: string;
  time: string;
  batchId: string;
  batchName: string;
}

export default function DailyAttendance() {
  const { t } = useLanguage();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchLessonsByDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedClass) {
      const lesson = lessons.find((item) => item.id === selectedClass);
      if (lesson) fetchStudentsForLesson(lesson.id, lesson.batchId, lesson.batchName);
    } else {
      setStudents([]);
    }
  }, [selectedClass, lessons]);

  async function fetchLessonsByDate(date: string) {
    setLoadingLessons(true);

    const start = `${date}T00:00:00+08:00`;
    const end = `${date}T23:59:59+08:00`;

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id,
        lesson_title,
        lesson_datetime,
        batch_id,
        class_batches(
          batch_name,
          courses(course_name)
        )
      `)
      .gte('lesson_datetime', start)
      .lte('lesson_datetime', end)
      .order('lesson_datetime', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error.message);
      setLoadingLessons(false);
      return;
    }

    const mapped: LessonOption[] = (data || []).map((lesson: any) => {
      const time = new Date(lesson.lesson_datetime).toTimeString().slice(0, 5);

      return {
        id: lesson.id,
        batchId: lesson.batch_id,
        batchName: lesson.class_batches?.batch_name || '-',
        rawTitle: lesson.lesson_title || lesson.class_batches?.courses?.course_name || '',
        time,
      };
    });

    setLessons(mapped);
    setSelectedClass(mapped[0]?.id || '');
    setLoadingLessons(false);
  }

  async function fetchStudentsForLesson(
    lessonId: string,
    batchId: string,
    batchName: string
  ) {
    setLoadingStudents(true);

    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        students(
          id,
          student_code,
          full_name
        )
      `)
      .eq('batch_id', batchId);

    if (enrollmentError) {
      console.error('Error fetching enrolled students:', enrollmentError.message);
      setLoadingStudents(false);
      return;
    }

    const { data: existingAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, attendance_status')
      .eq('lesson_id', lessonId);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError.message);
    }

    const attendanceMap = new Map(
      (existingAttendance || []).map((record: any) => [
        record.student_id,
        mapDbStatusToUi(record.attendance_status),
      ])
    );

    const mappedStudents: Student[] = (enrollments || []).map((row: any) => {
      const student = Array.isArray(row.students) ? row.students[0] : row.students;

      return {
        id: student?.student_code || '-',
        dbId: student?.id,
        name: student?.full_name || t('dailyAttendance.unnamedStudent'),
        batch: batchName,
        status: attendanceMap.get(student?.id) || null,
      };
    });

    setStudents(mappedStudents);
    setLoadingStudents(false);
  }

  const markAttendance = (id: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, status } : student
      )
    );
  };

  const markAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({ ...student, status: 'Present' as const }))
    );
  };

  async function handleSubmit() {
    if (!selectedClass) {
      alert(t('dailyAttendance.alert.selectClass'));
      return;
    }

    const records = students
      .filter((student) => student.status)
      .map((student) => ({
        student_id: student.dbId,
        lesson_id: selectedClass,
        attendance_status: mapUiStatusToDb(student.status as AttendanceStatus),
        remarks: null,
      }));

    if (records.length === 0) {
      alert(t('dailyAttendance.alert.markFirst'));
      return;
    }

    const { error } = await supabase
      .from('attendance')
      .upsert(records, {
        onConflict: 'student_id,lesson_id',
      });

    if (error) {
      alert(t('dailyAttendance.alert.saveFailed', { message: error.message }));
      return;
    }

    const presentCount = students.filter((s) => s.status === 'Present').length;
    const absentCount = students.filter((s) => s.status === 'Absent').length;

    alert(t('dailyAttendance.alert.saved', { present: presentCount, absent: absentCount }));
  }

  const stats = {
    present: students.filter((s) => s.status === 'Present').length,
    absent: students.filter((s) => s.status === 'Absent').length,
    late: students.filter((s) => s.status === 'Late').length,
    leave: students.filter((s) => s.status === 'Leave').length,
    total: students.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('dailyAttendance.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('dailyAttendance.subtitle')}
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          {t('dailyAttendance.saveAttendance')}
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-[#284342] mb-2">{t('dailyAttendance.field.date')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-[#284342] mb-2">{t('dailyAttendance.field.class')}</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              {loadingLessons && <option>{t('dailyAttendance.loadingClasses')}</option>}

              {!loadingLessons && lessons.length === 0 && (
                <option value="">{t('dailyAttendance.noClassesOnDate')}</option>
              )}

              {!loadingLessons &&
                lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {`${lesson.rawTitle || t('dailyAttendance.fallback.class')} - ${lesson.time}`}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<CheckCircle2 size={20} className="text-green-700" />}
            label={t('dailyAttendance.status.present')}
            value={`${stats.present}/${stats.total}`}
            bg="bg-green-50"
            text="text-green-700"
          />
          <StatCard
            icon={<XCircle size={20} className="text-red-700" />}
            label={t('dailyAttendance.status.absent')}
            value={`${stats.absent}/${stats.total}`}
            bg="bg-red-50"
            text="text-red-700"
          />
          <StatCard
            icon={<Clock size={20} className="text-yellow-700" />}
            label={t('dailyAttendance.status.late')}
            value={`${stats.late}/${stats.total}`}
            bg="bg-yellow-50"
            text="text-yellow-700"
          />
          <StatCard
            icon={<Coffee size={20} className="text-blue-700" />}
            label={t('dailyAttendance.status.leave')}
            value={`${stats.leave}/${stats.total}`}
            bg="bg-blue-50"
            text="text-blue-700"
          />
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={markAllPresent}
            disabled={students.length === 0}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm disabled:opacity-50"
          >
            {t('dailyAttendance.markAllPresent')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('dailyAttendance.table.studentId')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('dailyAttendance.table.name')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('dailyAttendance.table.batch')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('dailyAttendance.table.attendanceStatus')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
            {loadingStudents && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#6b6b6b]">
                  {t('dailyAttendance.loadingStudents')}
                </td>
              </tr>
            )}

            {!loadingStudents && students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#6b6b6b]">
                  {t('dailyAttendance.noStudentsEnrolled')}
                </td>
              </tr>
            )}

            {!loadingStudents &&
              students.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-[#f8f8f6] transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                    {student.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#284342]">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                    {student.batch}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <AttendanceButton
                        label={t('dailyAttendance.status.present')}
                        active={student.status === 'Present'}
                        color="green"
                        onClick={() => markAttendance(student.id, 'Present')}
                      />
                      <AttendanceButton
                        label={t('dailyAttendance.status.absent')}
                        active={student.status === 'Absent'}
                        color="red"
                        onClick={() => markAttendance(student.id, 'Absent')}
                      />
                      <AttendanceButton
                        label={t('dailyAttendance.status.late')}
                        active={student.status === 'Late'}
                        color="yellow"
                        onClick={() => markAttendance(student.id, 'Late')}
                      />
                      <AttendanceButton
                        label={t('dailyAttendance.status.leave')}
                        active={student.status === 'Leave'}
                        color="blue"
                        onClick={() => markAttendance(student.id, 'Leave')}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function mapUiStatusToDb(status: AttendanceStatus) {
  if (status === 'Present') return 'present';
  if (status === 'Absent') return 'absent';
  if (status === 'Late') return 'late';
  return 'leave';
}

function mapDbStatusToUi(status: string): AttendanceStatus {
  if (status === 'present') return 'Present';
  if (status === 'absent') return 'Absent';
  if (status === 'late') return 'Late';
  return 'Leave';
}

function StatCard({
  icon,
  label,
  value,
  bg,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  text: string;
}) {
  return (
    <div className={`${bg} p-4 rounded-lg`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-sm ${text}`}>{label}</span>
      </div>
      <p className={`text-2xl ${text}`}>{value}</p>
    </div>
  );
}

function AttendanceButton({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: 'green' | 'red' | 'yellow' | 'blue';
  onClick: () => void;
}) {
  const styles = {
    green: active
      ? 'bg-green-600 text-white'
      : 'border border-green-600 text-green-600 hover:bg-green-50',
    red: active
      ? 'bg-red-600 text-white'
      : 'border border-red-600 text-red-600 hover:bg-red-50',
    yellow: active
      ? 'bg-yellow-600 text-white'
      : 'border border-yellow-600 text-yellow-600 hover:bg-yellow-50',
    blue: active
      ? 'bg-blue-600 text-white'
      : 'border border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm transition-colors ${styles[color]}`}
    >
      {label}
    </button>
  );
}