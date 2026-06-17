import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CalendarClass {
  id: string;
  course: string;
  batch: string;
  startTime: string;
  endTime: string;
  teacher: string;
  room: string;
}

export default function ClassCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [classes, setClasses] = useState<Record<string, CalendarClass[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarClasses();
  }, []);

  async function fetchCalendarClasses() {
    setLoading(true);

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id,
        lesson_datetime,
        duration_minutes,
        class_batches(
          batch_name,
          courses(course_name)
        ),
        teachers(
          specialization,
          users(full_name)
        ),
        classrooms(room_name)
      `)
      .order('lesson_datetime', { ascending: true });

    if (error) {
      console.error('Error fetching calendar classes:', error.message);
      setLoading(false);
      return;
    }

    const grouped: Record<string, CalendarClass[]> = {};

    (data || []).forEach((lesson: any) => {
      const start = new Date(lesson.lesson_datetime);
      const duration = lesson.duration_minutes || 180;
      const end = new Date(start.getTime() + duration * 60000);

      const dateKey = start.toISOString().slice(0, 10);

      if (!grouped[dateKey]) grouped[dateKey] = [];

      grouped[dateKey].push({
        id: lesson.id,
        course: lesson.class_batches?.courses?.course_name || '-',
        batch: lesson.class_batches?.batch_name || '-',
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        teacher:
          getTeacherNameFromJoin(lesson.teachers),
        room: lesson.classrooms?.room_name || '-',
      });
    });

    setClasses(grouped);
    setLoading(false);
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getClassesForDay = (day: number | null) => {
    if (!day) return [];
    return classes[formatDate(day)] || [];
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const days = getDaysInMonth(currentDate);

  const isToday = (day: number | null) => {
    if (!day) return false;

    const today = new Date();

    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Class Calendar</h1>
          <p className="text-[#6b6b6b] mt-1">
            Visual calendar view of all scheduled classes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              view === 'month'
                ? 'bg-[#284342] text-[#e9da95]'
                : 'bg-white text-[#284342] border border-[rgba(40,67,66,0.2)]'
            }`}
          >
            Month
          </button>

          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              view === 'week'
                ? 'bg-[#284342] text-[#e9da95]'
                : 'bg-white text-[#284342] border border-[rgba(40,67,66,0.2)]'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading calendar...
        </div>
      )}

      {!loading && view === 'month' && (
        <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
          <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-[#284342]" />
            </button>

            <h2 className="text-lg text-[#284342]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-[#284342]" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-[rgba(40,67,66,0.1)]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm text-[#284342] bg-[#f8f8f6] border-r border-[rgba(40,67,66,0.1)] last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayClasses = getClassesForDay(day);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-[rgba(40,67,66,0.1)] ${
                    !day ? 'bg-gray-50' : ''
                  } ${isToday(day) ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm mb-2 ${
                          isToday(day)
                            ? 'text-blue-700 font-semibold'
                            : 'text-[#6b6b6b]'
                        }`}
                      >
                        {day}
                      </div>

                      <div className="space-y-1">
                        {dayClasses.map((cls) => (
                          <div
                            key={cls.id}
                            className="bg-[#284342] text-[#e9da95] p-1.5 rounded text-xs"
                            title={`${cls.course} | ${cls.teacher} | ${cls.room}`}
                          >
                            <div className="truncate">
                              {cls.startTime} - {cls.endTime}
                            </div>
                            <div className="truncate">{cls.batch}</div>
                            <div className="truncate text-[#e9da95]/80">
                              {cls.room}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && view === 'week' && (
        <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] p-6">
          <p className="text-center text-[#6b6b6b] py-8">
            Week view can be added after month calendar is stable.
          </p>
        </div>
      )}
    </div>
  );
}

function getTeacherNameFromJoin(teacher: any) {
  if (!teacher) return '-';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;

  if (!actualTeacher) return '-';

  const users = actualTeacher.users;
  const actualUser = Array.isArray(users) ? users[0] : users;

  return (
    actualUser?.full_name ||
    actualTeacher.specialization ||
    '-'
  );
}