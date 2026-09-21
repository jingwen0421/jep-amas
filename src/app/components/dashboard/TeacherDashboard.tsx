import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ClipboardList,
  CalendarClock,
  BadgeCheck,
  PartyPopper,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentTeacherId } from '../../utils/teacherAccess';
import { useLanguage } from '../../context/LanguageContext';

interface TodayLesson {
  id: string;
  title: string;
  time: string;
  room: string;
  studentCount: number;
  confirmed: boolean;
}

interface UnconfirmedLesson {
  id: string;
  title: string;
  date: string;
  time: string;
  room: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  datetime: string;
  eventKind: string;
}

export default function TeacherDashboard() {
  const currentUser = getCurrentUser();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState('');

  const [todayLessons, setTodayLessons] = useState<TodayLesson[]>([]);
  const [unconfirmedLessons, setUnconfirmedLessons] = useState<UnconfirmedLesson[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [myEvents, setMyEvents] = useState<UpcomingEvent[]>([]);
  const [availabilityCount, setAvailabilityCount] = useState(0);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    const id = await getCurrentTeacherId();
    setTeacherId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const [lessonsRes, eventStaffRes, availabilityRes] = await Promise.all([
      supabase
        .from('lessons')
        .select(`
          id,
          lesson_title,
          lesson_datetime,
          teacher_confirmed_at,
          classrooms(room_name),
          course_modules(title),
          lesson_participants(id)
        `)
        .eq('teacher_id', id)
        .order('lesson_datetime', { ascending: true }),

      supabase
        .from('event_staff')
        .select(`
          id,
          event_occurrences(
            id,
            starts_at,
            status,
            events(title, event_kind)
          )
        `)
        .eq('user_id', currentUser.id)
        .limit(10),

      supabase
        .from('teacher_availability')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', id)
        .eq('status', 'active')
        .gte('available_date', today),
    ]);

    const lessons = lessonsRes.data || [];

    const todays = lessons.filter(
      (l: any) => l.lesson_datetime && l.lesson_datetime.slice(0, 10) === today
    );

    setTodayLessons(
      todays.map((lesson: any) => {
        const room = getSingle(lesson.classrooms);
        const module = getSingle(lesson.course_modules);

        return {
          id: lesson.id,
          title: module?.title || lesson.lesson_title || t('dashboard.teacher.fallback.class'),
          time: new Date(lesson.lesson_datetime).toTimeString().slice(0, 5),
          room: room?.room_name || '-',
          studentCount: (lesson.lesson_participants || []).length,
          confirmed: !!lesson.teacher_confirmed_at,
        };
      })
    );

    const nowIso = new Date().toISOString();
    setUnconfirmedLessons(
      lessons
        .filter((l: any) => !l.teacher_confirmed_at && l.lesson_datetime >= nowIso)
        .map((lesson: any) => {
          const room = getSingle(lesson.classrooms);
          const module = getSingle(lesson.course_modules);
          const dt = new Date(lesson.lesson_datetime);

          return {
            id: lesson.id,
            title: module?.title || lesson.lesson_title || t('dashboard.teacher.fallback.class'),
            date: dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            time: dt.toTimeString().slice(0, 5),
            room: room?.room_name || '-',
          };
        })
        .slice(0, 6)
    );

    const uniqueStudents = new Set<string>();
    lessons.forEach((lesson: any) => {
      (lesson.lesson_participants || []).forEach((p: any) => {
        if (p?.id) uniqueStudents.add(p.id);
      });
    });
    setTotalStudents(uniqueStudents.size);

    const nowIsoForEvents = new Date().toISOString();
    setMyEvents(
      (eventStaffRes.data || [])
        .map((row: any) => getSingle(row.event_occurrences))
        .filter(
          (occ: any) =>
            occ && occ.status === 'scheduled' && occ.starts_at >= nowIsoForEvents
        )
        .sort((a: any, b: any) => String(a.starts_at).localeCompare(String(b.starts_at)))
        .slice(0, 5)
        .map((occ: any) => {
          const eventInfo = getSingle(occ.events);
          return {
            id: occ.id,
            title: eventInfo?.title || t('dashboard.teacher.fallback.academyEvent'),
            datetime: occ.starts_at,
            eventKind: eventInfo?.event_kind || 'event',
          };
        })
    );

    setAvailabilityCount(availabilityRes.count || 0);
    setLoading(false);
  }

  async function confirmLesson(lessonId: string) {
    setConfirmingId(lessonId);

    const { error } = await supabase
      .from('lessons')
      .update({ teacher_confirmed_at: new Date().toISOString() })
      .eq('id', lessonId);

    setConfirmingId(null);

    if (error) {
      console.error('Error confirming class:', error.message);
      return;
    }

    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('dashboard.teacher.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">{t('dashboard.teacher.welcome', { name: currentUser.name })}</p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('dashboard.teacher.loading')}
        </div>
      )}

      {!loading && !teacherId && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('dashboard.teacher.noProfile')}
        </div>
      )}

      {!loading && teacherId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              icon={<Calendar size={24} />}
              color="#284342"
              label={t('dashboard.teacher.todayClasses')}
              value={todayLessons.length}
              subtitle={t('dashboard.teacher.scheduledToday')}
            />
            <StatCard
              icon={<BadgeCheck size={24} />}
              color={unconfirmedLessons.length > 0 ? '#d4183d' : '#2d8659'}
              label={t('dashboard.teacher.needsConfirmation')}
              value={unconfirmedLessons.length}
              subtitle={t('dashboard.teacher.classesNotConfirmed')}
            />
            <StatCard
              icon={<Users size={24} />}
              color="#6b8e8d"
              label={t('dashboard.teacher.myStudents')}
              value={totalStudents}
              subtitle={t('dashboard.teacher.acrossAllClasses')}
            />
            <StatCard
              icon={<PartyPopper size={24} />}
              color="#7c3aed"
              label={t('dashboard.teacher.myEvents')}
              value={myEvents.length}
              subtitle={t('dashboard.teacher.upcomingInvolved')}
            />
            <StatCard
              icon={<CalendarClock size={24} />}
              color="#6b6b6b"
              label={t('dashboard.teacher.unavailableWindows')}
              value={availabilityCount}
              subtitle={t('dashboard.teacher.markedUnavailable')}
            />
          </div>

          {unconfirmedLessons.length > 0 && (
            <Panel
              title={t('dashboard.teacher.awaitingConfirmation')}
              actionLabel={t('dashboard.teacher.viewCalendar')}
              actionLink="/app/calendar"
            >
              <div className="space-y-3">
                {unconfirmedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200"
                  >
                    <div>
                      <p className="text-sm text-[#284342]">{lesson.title}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        {lesson.date} • {lesson.time} • {lesson.room}
                      </p>
                    </div>
                    <button
                      onClick={() => confirmLesson(lesson.id)}
                      disabled={confirmingId === lesson.id}
                      className="px-3 py-2 rounded-lg bg-[#284342] text-[#e9da95] text-xs hover:bg-[#1a2f2e] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      <BadgeCheck size={14} />
                      {confirmingId === lesson.id ? t('dashboard.teacher.confirming') : t('dashboard.teacher.confirm')}
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title={t('dashboard.teacher.todayClasses')} actionLabel={t('dashboard.teacher.viewCalendar')} actionLink="/app/calendar">
              <div className="space-y-3">
                {todayLessons.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">{t('dashboard.teacher.noClassesToday')}</p>
                )}
                {todayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-[#f8f8f6]"
                  >
                    <div className="flex flex-col items-center">
                      <Clock size={18} className="text-[#284342] mb-1" />
                      <span className="text-xs text-[#6b6b6b]">{lesson.time}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[#284342]">{lesson.title}</p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            lesson.confirmed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {lesson.confirmed ? t('dashboard.teacher.confirmed') : t('dashboard.teacher.unconfirmed')}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        {lesson.room} • {lesson.studentCount} {t('dashboard.teacher.studentsSuffix')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title={t('dashboard.teacher.myEvents')}
              actionLabel={t('dashboard.teacher.viewAll')}
              actionLink="/app/events"
            >
              <div className="space-y-3">
                {myEvents.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">{t('dashboard.teacher.noUpcomingEvents')}</p>
                )}
                {myEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-lg bg-[#f8f8f6] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-[#284342]">{evt.title}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1 capitalize">
                        {evt.eventKind.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="text-xs text-[#6b6b6b]">
                      {new Date(evt.datetime).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <h2 className="text-xl text-[#284342] mb-4">{t('dashboard.teacher.quickActions')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <QuickAction to="/app/attendance/daily" icon={<CheckCircle2 size={22} />} label={t('dashboard.teacher.takeAttendance')} />
              <QuickAction to="/app/appointments/availability" icon={<CalendarClock size={22} />} label={t('dashboard.teacher.myAvailability')} />
              <QuickAction to="/app/calendar" icon={<Calendar size={22} />} label={t('dashboard.teacher.viewCalendar')} />
              <QuickAction to="/app/events" icon={<PartyPopper size={22} />} label={t('dashboard.teacher.myEvents')} />
              <QuickAction to="/app/portfolio/feedback" icon={<ClipboardList size={22} />} label={t('dashboard.teacher.portfolioFeedback')} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  color,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow">
      <div
        className="p-3 rounded-lg inline-block mb-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="text-sm text-[#6b6b6b] mb-1">{label}</h3>
      <p className="text-2xl text-[#284342]">{value}</p>
      <p className="text-xs text-[#6b6b6b] mt-2">{subtitle}</p>
    </div>
  );
}

function Panel({
  title,
  actionLabel,
  actionLink,
  children,
}: {
  title: string;
  actionLabel: string;
  actionLink: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-[#284342]">{title}</h2>
        <Link to={actionLink} className="text-sm text-[#284342] hover:underline">
          {actionLabel}
        </Link>
      </div>
      {children}
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
    >
      <div className="mx-auto mb-2 text-[#284342] flex justify-center">{icon}</div>
      <span className="text-sm text-[#284342]">{label}</span>
    </Link>
  );
}

function getSingle(value: any) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}
