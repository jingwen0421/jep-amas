import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  CalendarDays,
  Plus,
  CalendarPlus,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import { getCurrentTeacherId } from '../../utils/teacherAccess';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { useLanguage } from '../../context/LanguageContext';

type ItemType = 'class' | 'external_makeup' | 'event' | 'room_rental';

interface CalendarItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  date: string; // yyyy-mm-dd
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  calendarEventId: string | null;
}

const TYPE_META: Record<
  ItemType,
  { dot: string; block: string; badge: string }
> = {
  class: {
    dot: 'bg-[#284342]',
    block: 'bg-[#284342] text-[#e9da95]',
    badge: 'bg-[#284342]/10 text-[#284342]',
  },
  external_makeup: {
    dot: 'bg-orange-600',
    block: 'bg-orange-600 text-white',
    badge: 'bg-orange-100 text-orange-700',
  },
  event: {
    dot: 'bg-purple-600',
    block: 'bg-purple-600 text-white',
    badge: 'bg-purple-100 text-purple-700',
  },
  room_rental: {
    dot: 'bg-amber-500',
    block: 'bg-amber-500 text-white',
    badge: 'bg-amber-100 text-amber-700',
  },
};

const TYPE_LABEL_KEYS: Record<ItemType, string> = {
  class: 'unifiedCalendar.type.class',
  external_makeup: 'unifiedCalendar.type.externalMakeup',
  event: 'unifiedCalendar.type.event',
  room_rental: 'unifiedCalendar.type.roomRental',
};

function getTypeLabel(type: ItemType, t: (key: string) => string) {
  return t(TYPE_LABEL_KEYS[type]);
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  scheduled: 'unifiedCalendar.status.scheduled',
  completed: 'unifiedCalendar.status.completed',
  cancelled: 'unifiedCalendar.status.cancelled',
  confirmed: 'unifiedCalendar.status.confirmed',
  pending: 'unifiedCalendar.status.pending',
  approved: 'unifiedCalendar.status.approved',
  rejected: 'unifiedCalendar.status.rejected',
  active: 'common.active',
};

function getStatusLabel(status: string, t: (key: string) => string) {
  const key = STATUS_LABEL_KEYS[String(status || '').toLowerCase()];
  return key ? t(key) : status;
}

// Calendar items are fetched once and re-rendered on every language switch
// without a refetch, so any fixed English fallback text composed into
// title/subtitle at fetch time is stored as one of these language-neutral
// sentinel tokens instead of real text — resolveDisplay() below swaps each
// sentinel for its translated string at render time. Real data (course
// names, batch names, renter names, teacher names, etc.) never gets a
// sentinel and passes through resolveDisplay() unchanged.
const S_CLASS = '⁣CLASS⁣';
const S_SCHEDULED_SESSION = '⁣SCHEDULED_SESSION⁣';
const S_MAKEUP_PREFIX = '⁣MAKEUP_PREFIX⁣';
const S_MAKEUP_CLASS = '⁣MAKEUP_CLASS⁣';
const S_EXTERNAL_MAKEUP = '⁣EXTERNAL_MAKEUP⁣';
const S_WITH = '⁣WITH⁣';
const S_OFFSITE = '⁣OFFSITE⁣';
const S_ACADEMY_EVENT = '⁣ACADEMY_EVENT⁣';
const S_EVENT = '⁣EVENT⁣';
const S_ROOM_RENTAL_PREFIX = '⁣ROOM_RENTAL_PREFIX⁣';
const S_EXTERNAL_COWORKING = '⁣EXTERNAL_COWORKING⁣';

const SENTINEL_KEYS: [string, string][] = [
  [S_CLASS, 'unifiedCalendar.fallback.class'],
  [S_SCHEDULED_SESSION, 'unifiedCalendar.fallback.scheduledSession'],
  [S_MAKEUP_PREFIX, 'unifiedCalendar.makeupPrefix'],
  [S_MAKEUP_CLASS, 'unifiedCalendar.fallback.makeupClass'],
  [S_EXTERNAL_MAKEUP, 'unifiedCalendar.type.externalMakeup'],
  [S_WITH, 'unifiedCalendar.withPrefix'],
  [S_OFFSITE, 'unifiedCalendar.fallback.offsite'],
  [S_ACADEMY_EVENT, 'unifiedCalendar.fallback.academyEvent'],
  [S_EVENT, 'unifiedCalendar.type.event'],
  [S_ROOM_RENTAL_PREFIX, 'unifiedCalendar.roomRentalPrefix'],
  [S_EXTERNAL_COWORKING, 'unifiedCalendar.fallback.externalCoworking'],
];

function resolveDisplay(text: string, t: (key: string) => string) {
  let result = text;
  for (const [sentinel, key] of SENTINEL_KEYS) {
    if (result.includes(sentinel)) result = result.split(sentinel).join(t(key));
  }
  return result;
}

const ALL_TYPES: ItemType[] = [
  'class',
  'external_makeup',
  'event',
  'room_rental',
];

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export default function UnifiedCalendar() {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const isStudentView = currentUser.role === 'student';
  const isTeacherView =
    currentUser.role === 'teacher' || currentUser.role === 'assistant_teacher';

  // Matches the events table's is_academy_admin()-only RLS policy — only
  // admins/super_admins can actually create an event, so the quick action
  // is hidden for everyone else rather than surfacing a button that would
  // just fail.
  const canManageEvents =
    currentUser.role === 'super_admin' || currentUser.role === 'admin';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  // 'all' shows everything; picking a specific type shows only that type —
  // clicking a filter is meant to isolate that activity, not toggle it in
  // and out of a combined view.
  const [activeFilter, setActiveFilter] = useState<ItemType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [rescheduleMap, setRescheduleMap] = useState<Record<string, string>>({});
  const [rescheduleTarget, setRescheduleTarget] = useState<CalendarItem | null>(
    null
  );
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [reschedulePreferred, setReschedulePreferred] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    setLoading(true);

    const eventIdMap = await fetchCalendarEventIdMap();

    const tasks: Promise<CalendarItem[]>[] = [
      fetchClasses(eventIdMap),
      fetchMakeupClasses(eventIdMap),
      fetchEvents(),
      fetchRoomRentals(eventIdMap),
    ];

    if (isStudentView) tasks.push(fetchMyRescheduleRequests());

    const results = await Promise.all(tasks);
    const [classItems, makeupItems, eventItems, roomRentalItems] = results;

    setItems([...classItems, ...makeupItems, ...eventItems, ...roomRentalItems]);
    setLoading(false);
  }

  async function fetchCalendarEventIdMap(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, source_table, source_id');

    if (error) {
      console.error('Failed to fetch calendar event map:', error.message);
      return {};
    }

    const map: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      map[`${row.source_table}:${row.source_id}`] = row.id;
    });

    return map;
  }

  async function fetchMyRescheduleRequests(): Promise<CalendarItem[]> {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
      setRescheduleMap({});
      return [];
    }

    const { data, error } = await supabase
      .from('reschedule_requests')
      .select('calendar_event_id, status')
      .eq('student_id', studentId);

    if (error) {
      console.error('Failed to fetch reschedule requests:', error.message);
      return [];
    }

    const map: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      map[row.calendar_event_id] = row.status;
    });

    setRescheduleMap(map);
    return [];
  }

  async function fetchClasses(
    eventIdMap: Record<string, string>
  ): Promise<CalendarItem[]> {
    let teacherId: string | null = null;
    let lessonIds: string[] | null = null;

    if (isStudentView) {
      const studentId = await getCurrentStudentId();
      if (!studentId) return [];

      // Attendance is driven by the lesson_participants roster now, not
      // just batch membership — a student can be added to a session
      // individually or via "auto-fill eligible" as well as by batch.
      const { data } = await supabase
        .from('lesson_participants')
        .select('lesson_id')
        .eq('student_id', studentId);

      lessonIds = (data || []).map((row: any) => row.lesson_id).filter(Boolean);
      if (lessonIds.length === 0) return [];
    } else if (isTeacherView) {
      teacherId = await getCurrentTeacherId();
      if (!teacherId) return [];
    }

    let query = supabase
      .from('lessons')
      .select(
        `
        id,
        lesson_title,
        lesson_datetime,
        duration_minutes,
        status,
        class_batches(batch_name, courses(course_name)),
        course_modules(title, courses(course_name)),
        teachers(specialization, users(full_name)),
        classrooms(room_name)
      `
      )
      .order('lesson_datetime', { ascending: true });

    if (lessonIds) query = query.in('id', lessonIds);
    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch lessons:', error.message);
      return [];
    }

    return (data || [])
      .map((lesson: any) => {
        const start = lesson.lesson_datetime
          ? new Date(lesson.lesson_datetime)
          : null;
        const duration = lesson.duration_minutes || 180;
        const end = start ? new Date(start.getTime() + duration * 60000) : null;

        return {
          id: `class-${lesson.id}`,
          type: 'class' as const,
          title:
            lesson.class_batches?.courses?.course_name ||
            lesson.course_modules?.courses?.course_name ||
            lesson.lesson_title ||
            S_CLASS,
          subtitle: `${
            lesson.class_batches?.batch_name ||
            lesson.course_modules?.title ||
            S_SCHEDULED_SESSION
          } • ${getTeacherName(lesson.teachers)}`,
          date: start ? start.toISOString().slice(0, 10) : '',
          startTime: start ? start.toTimeString().slice(0, 5) : '-',
          endTime: end ? end.toTimeString().slice(0, 5) : '-',
          location: lesson.classrooms?.room_name || '-',
          status: lesson.status || 'scheduled',
          calendarEventId: eventIdMap[`lessons:${lesson.id}`] || null,
        };
      })
      .filter((item) => item.date);
  }

  async function fetchMakeupClasses(
    eventIdMap: Record<string, string>
  ): Promise<CalendarItem[]> {
    const { data, error } = await supabase
      .from('makeup_classes')
      .select(
        `
        id,
        makeup_datetime,
        status,
        reason,
        is_external,
        external_provider,
        students(full_name),
        teachers(specialization, users(full_name))
      `
      )
      .order('makeup_datetime', { ascending: true });

    if (error) {
      console.error('Failed to fetch makeup classes:', error.message);
      return [];
    }

    return (data || [])
      .map((makeup: any) => {
        const start = makeup.makeup_datetime
          ? new Date(makeup.makeup_datetime)
          : null;
        const end = start ? new Date(start.getTime() + 180 * 60000) : null;

        const isExternal = !!makeup.is_external;

        return {
          id: `makeup-${makeup.id}`,
          // An in-house makeup class is still just a class on the
          // academy's own schedule, so it's filed under the same "Class"
          // type as a regular lesson. Only a makeup done through an
          // external/outsourced provider gets its own "External Makeup"
          // type — it's not on the academy's own schedule at all.
          type: isExternal ? ('external_makeup' as const) : ('class' as const),
          title: isExternal
            ? `${S_EXTERNAL_MAKEUP}${makeup.external_provider ? `: ${makeup.external_provider}` : ''}`
            : makeup.reason
            ? `${S_MAKEUP_PREFIX}: ${makeup.reason}`
            : S_MAKEUP_CLASS,
          subtitle: isExternal
            ? `${getStudentName(makeup.students)}${
                makeup.reason ? ` • ${makeup.reason}` : ''
              }`
            : isStudentView
            ? `${S_WITH} ${getTeacherName(makeup.teachers)}`
            : `${getStudentName(makeup.students)} • ${getTeacherName(
                makeup.teachers
              )}`,
          date: start ? start.toISOString().slice(0, 10) : '',
          startTime: start ? start.toTimeString().slice(0, 5) : '-',
          endTime: end ? end.toTimeString().slice(0, 5) : '-',
          location: isExternal ? makeup.external_provider || S_OFFSITE : '-',
          status: makeup.status || 'scheduled',
          calendarEventId: eventIdMap[`makeup_classes:${makeup.id}`] || null,
        };
      })
      .filter((item) => item.date);
  }

  async function fetchRoomRentals(
    eventIdMap: Record<string, string>
  ): Promise<CalendarItem[]> {
    const { data, error } = await supabase
      .from('room_rentals')
      .select(
        `
        id,
        renter_name,
        renter_contact,
        starts_at,
        ends_at,
        status,
        classrooms(room_name)
      `
      )
      .neq('status', 'cancelled')
      .order('starts_at', { ascending: true });

    if (error) {
      // Students/teachers don't have SELECT access to room_rentals (staff-
      // only per RLS) — that's expected and not worth logging as an error.
      return [];
    }

    return (data || [])
      .map((rental: any) => {
        const start = rental.starts_at ? new Date(rental.starts_at) : null;
        const end = rental.ends_at ? new Date(rental.ends_at) : null;
        const venue = Array.isArray(rental.classrooms)
          ? rental.classrooms[0]
          : rental.classrooms;

        return {
          id: `room_rental-${rental.id}`,
          type: 'room_rental' as const,
          title: `${S_ROOM_RENTAL_PREFIX}: ${rental.renter_name}`,
          subtitle: rental.renter_contact || S_EXTERNAL_COWORKING,
          date: start ? start.toISOString().slice(0, 10) : '',
          startTime: start ? start.toTimeString().slice(0, 5) : '-',
          endTime: end ? end.toTimeString().slice(0, 5) : '-',
          location: venue?.room_name || '-',
          status: rental.status || 'scheduled',
          calendarEventId: eventIdMap[`room_rentals:${rental.id}`] || null,
        };
      })
      .filter((item) => item.date);
  }

  async function fetchEvents(): Promise<CalendarItem[]> {
    const { data, error } = await supabase
      .from('event_occurrences')
      .select(
        `
        id,
        starts_at,
        ends_at,
        status,
        events(title, event_kind)
      `
      )
      .order('starts_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch events:', error.message);
      return [];
    }

    return (data || [])
      .map((occurrence: any) => {
        const start = occurrence.starts_at ? new Date(occurrence.starts_at) : null;
        const end = occurrence.ends_at ? new Date(occurrence.ends_at) : null;

        return {
          id: `event-${occurrence.id}`,
          type: 'event' as const,
          title: occurrence.events?.title || S_ACADEMY_EVENT,
          subtitle: occurrence.events?.event_kind || S_EVENT,
          date: start ? start.toISOString().slice(0, 10) : '',
          startTime: start ? start.toTimeString().slice(0, 5) : '-',
          endTime: end ? end.toTimeString().slice(0, 5) : '-',
          location: '-',
          status: occurrence.status || 'scheduled',
          calendarEventId: null,
        };
      })
      .filter((item) => item.date);
  }

  const visibleItems = useMemo(
    () => (activeFilter === 'all' ? items : items.filter((item) => item.type === activeFilter)),
    [items, activeFilter]
  );

  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};

    visibleItems.forEach((item) => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push(item);
    });

    Object.values(grouped).forEach((dayItems) =>
      dayItems.sort((a, b) => a.startTime.localeCompare(b.startTime))
    );

    return grouped;
  }, [visibleItems]);


  function openRescheduleModal(item: CalendarItem) {
    setRescheduleTarget(item);
    setRescheduleReason('');
    setReschedulePreferred('');
    setRescheduleError(null);
  }

  function closeRescheduleModal() {
    setRescheduleTarget(null);
    setRescheduleReason('');
    setReschedulePreferred('');
    setRescheduleError(null);
  }

  async function submitRescheduleRequest() {
    if (!rescheduleTarget?.calendarEventId) return;

    if (!rescheduleReason.trim()) {
      setRescheduleError(t('unifiedCalendar.error.reasonRequired'));
      return;
    }

    const studentId = await getCurrentStudentId();

    if (!studentId) {
      setRescheduleError(t('unifiedCalendar.error.noStudentProfile'));
      return;
    }

    setRescheduleSubmitting(true);

    const { error } = await supabase.from('reschedule_requests').insert({
      calendar_event_id: rescheduleTarget.calendarEventId,
      student_id: studentId,
      reason: rescheduleReason.trim(),
      preferred_period: reschedulePreferred.trim() || null,
    });

    setRescheduleSubmitting(false);

    if (error) {
      setRescheduleError(error.message);
      return;
    }

    const calendarEventId = rescheduleTarget.calendarEventId;
    setRescheduleMap((prev) => ({ ...prev, [calendarEventId]: 'pending' }));
    closeRescheduleModal();
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayItems = itemsByDate[today] || [];

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));

  const weekCount = weekDates.reduce(
    (sum, date) => sum + (itemsByDate[toDateKey(date)] || []).length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('unifiedCalendar.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {isStudentView
              ? t('unifiedCalendar.subtitle.student')
              : isTeacherView
              ? t('unifiedCalendar.subtitle.teacher')
              : t('unifiedCalendar.subtitle.staff')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              view === 'month'
                ? 'bg-[#284342] text-[#e9da95]'
                : 'bg-white text-[#284342] border border-[rgba(40,67,66,0.2)]'
            }`}
          >
            {t('unifiedCalendar.view.month')}
          </button>

          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              view === 'week'
                ? 'bg-[#284342] text-[#e9da95]'
                : 'bg-white text-[#284342] border border-[rgba(40,67,66,0.2)]'
            }`}
          >
            {t('unifiedCalendar.view.week')}
          </button>

          {canManageEvents && (
            <>
              <span className="w-px h-6 bg-[rgba(40,67,66,0.15)] mx-1" />

              {/* Classes already have a proper home with roster + conflict
                  checking (Class Scheduling) — this deep-links there rather
                  than duplicating that logic in a calendar modal. */}
              <Link
                to="/app/classes/scheduling"
                className="px-4 py-2 rounded-lg text-sm bg-white text-[#284342] border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} />
                {t('unifiedCalendar.scheduleClass')}
              </Link>

              {/* Event Management owns full event creation (staff-involved
                  + registrants), so this deep-links there rather than
                  duplicating that logic in a lightweight calendar modal. */}
              <Link
                to="/app/events"
                className="px-4 py-2 rounded-lg text-sm bg-white text-[#284342] border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors flex items-center gap-1.5"
              >
                <CalendarPlus size={16} />
                {t('unifiedCalendar.addEvent')}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          label={t('unifiedCalendar.summary.today')}
          value={todayItems.length}
          color="text-[#284342]"
        />
        <SummaryCard
          label={t('unifiedCalendar.summary.thisWeek')}
          value={weekCount}
          color="text-blue-700"
        />
        <SummaryCard
          label={t('unifiedCalendar.summary.totalScheduled')}
          value={visibleItems.length}
          color="text-amber-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-[#6b6b6b] mr-1">{t('unifiedCalendar.show')}</span>

        <button
          onClick={() => setActiveFilter('all')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors ${
            activeFilter === 'all'
              ? 'border-transparent bg-[#284342] text-[#e9da95]'
              : 'border-[rgba(40,67,66,0.15)] text-[#6b6b6b]'
          }`}
        >
          {t('unifiedCalendar.filterAll')}
        </button>

        {ALL_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const active = activeFilter === type;

          return (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                active
                  ? 'border-transparent ' + meta.badge
                  : 'border-[rgba(40,67,66,0.15)] text-[#6b6b6b]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              {getTypeLabel(type, t)}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('unifiedCalendar.loading')}
        </div>
      )}

      {!loading && view === 'month' && (
        <MonthGrid
          currentDate={currentDate}
          itemsByDate={itemsByDate}
          onPrev={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
            )
          }
          onNext={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
            )
          }
          onSelectDate={setSelectedDate}
        />
      )}

      {!loading && view === 'week' && (
        <WeekAgenda
          weekDates={weekDates}
          itemsByDate={itemsByDate}
          onPrev={() => setCurrentDate(addDays(currentDate, -7))}
          onNext={() => setCurrentDate(addDays(currentDate, 7))}
          onSelectDate={setSelectedDate}
        />
      )}

      <Dialog
        open={!!selectedDate}
        onOpenChange={(open) => !open && setSelectedDate(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#284342]">
              {selectedDate ? formatFullDate(selectedDate) : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedDate
                ? t('unifiedCalendar.scheduledItemCount', { count: (itemsByDate[selectedDate] || []).length })
                : ''}
            </DialogDescription>
          </DialogHeader>

          {canManageEvents && selectedDate && (
            <div className="flex items-center gap-2 pb-3 mb-1 border-b border-[rgba(40,67,66,0.1)]">
              <Link
                to={`/app/classes/scheduling?date=${selectedDate}`}
                onClick={() => setSelectedDate(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center gap-1"
              >
                <Plus size={13} />
                {t('unifiedCalendar.scheduleClassOnDay')}
              </Link>

              <Link
                to={`/app/events?date=${selectedDate}`}
                onClick={() => setSelectedDate(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center gap-1"
              >
                <CalendarPlus size={13} />
                {t('unifiedCalendar.addEventOnDay')}
              </Link>
            </div>
          )}

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDate &&
              (itemsByDate[selectedDate] || []).length === 0 && (
                <p className="text-sm text-[#6b6b6b] py-4 text-center">
                  {t('unifiedCalendar.nothingScheduled')}
                </p>
              )}

            {selectedDate &&
              (itemsByDate[selectedDate] || []).map((item) => (
                <DayDetailCard
                  key={item.id}
                  item={item}
                  isStudentView={isStudentView}
                  rescheduleStatus={
                    item.calendarEventId
                      ? rescheduleMap[item.calendarEventId]
                      : undefined
                  }
                  onRequestReschedule={openRescheduleModal}
                />
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(open) => !open && closeRescheduleModal()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#284342]">
              {t('unifiedCalendar.requestReschedule')}
            </DialogTitle>
            <DialogDescription>
              {rescheduleTarget
                ? `${resolveDisplay(rescheduleTarget.title, t)} — ${rescheduleTarget.date}, ${rescheduleTarget.startTime}-${rescheduleTarget.endTime}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                {t('unifiedCalendar.reason')}
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={3}
                placeholder={t('unifiedCalendar.reasonPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                {t('unifiedCalendar.preferredNewTime')}
              </label>
              <input
                value={reschedulePreferred}
                onChange={(e) => setReschedulePreferred(e.target.value)}
                placeholder={t('unifiedCalendar.preferredTimePlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>

            {rescheduleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{rescheduleError}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={closeRescheduleModal}
              className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
            >
              {t('unifiedCalendar.cancel')}
            </button>

            <button
              onClick={submitRescheduleRequest}
              disabled={rescheduleSubmitting}
              className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
            >
              {rescheduleSubmitting ? t('unifiedCalendar.submitting') : t('unifiedCalendar.submitRequest')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function MonthGrid({
  currentDate,
  itemsByDate,
  onPrev,
  onNext,
  onSelectDate,
}: {
  currentDate: Date;
  itemsByDate: Record<string, CalendarItem[]>;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (date: string) => void;
}) {
  const { t } = useLanguage();
  const days = getDaysInMonth(currentDate);
  const today = new Date().toISOString().slice(0, 10);

  function formatDate(day: number) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
      <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
        <button
          onClick={onPrev}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-[#284342]" />
        </button>

        <h2 className="text-lg text-[#284342]">
          {t(`unifiedCalendar.month.${MONTH_KEYS[currentDate.getMonth()]}`)} {currentDate.getFullYear()}
        </h2>

        <button
          onClick={onNext}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-[#284342]" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-[rgba(40,67,66,0.1)]">
        {WEEKDAY_KEYS.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm text-[#284342] bg-[#f8f8f6] border-r border-[rgba(40,67,66,0.1)] last:border-r-0"
          >
            {t(`unifiedCalendar.weekday.${day}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dateKey = day ? formatDate(day) : '';
          const dayItems = day ? itemsByDate[dateKey] || [] : [];
          const isToday = dateKey === today;

          return (
            <button
              key={index}
              disabled={!day}
              onClick={() => day && onSelectDate(dateKey)}
              className={`min-h-[120px] p-2 border-r border-b border-[rgba(40,67,66,0.1)] text-left align-top ${
                !day ? 'bg-gray-50 cursor-default' : 'hover:bg-[#f8f8f6] transition-colors'
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              {day && (
                <>
                  <div
                    className={`text-sm mb-2 ${
                      isToday ? 'text-blue-700 font-semibold' : 'text-[#6b6b6b]'
                    }`}
                  >
                    {day}
                  </div>

                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className={`p-1.5 rounded text-xs ${TYPE_META[item.type].block}`}
                        title={`${resolveDisplay(item.title, t)} • ${resolveDisplay(item.subtitle, t)}`}
                      >
                        <div className="truncate">
                          {item.startTime} {resolveDisplay(item.title, t)}
                        </div>
                      </div>
                    ))}

                    {dayItems.length > 3 && (
                      <div className="text-xs text-[#6b6b6b] pl-1">
                        {t('unifiedCalendar.more', { count: dayItems.length - 3 })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekAgenda({
  weekDates,
  itemsByDate,
  onPrev,
  onNext,
  onSelectDate,
}: {
  weekDates: Date[];
  itemsByDate: Record<string, CalendarItem[]>;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (date: string) => void;
}) {
  const { t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
      <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
        <button
          onClick={onPrev}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-[#284342]" />
        </button>

        <h2 className="text-lg text-[#284342]">
          {formatShortDate(weekDates[0])} – {formatShortDate(weekDates[6])}
        </h2>

        <button
          onClick={onNext}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-[#284342]" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[rgba(40,67,66,0.1)]">
        {weekDates.map((date) => {
          const dateKey = toDateKey(date);
          const dayItems = itemsByDate[dateKey] || [];
          const isToday = dateKey === today;

          return (
            <div key={dateKey} className="min-h-[160px] flex flex-col">
              <button
                onClick={() => onSelectDate(dateKey)}
                className={`p-3 text-left border-b border-[rgba(40,67,66,0.1)] hover:bg-[#f8f8f6] transition-colors ${
                  isToday ? 'bg-blue-50' : ''
                }`}
              >
                <p className="text-xs text-[#6b6b6b]">
                  {t(`unifiedCalendar.weekday.${WEEKDAY_KEYS[date.getDay()]}`)}
                </p>
                <p
                  className={`text-sm ${
                    isToday ? 'text-blue-700 font-semibold' : 'text-[#284342]'
                  }`}
                >
                  {date.getDate()}
                </p>
              </button>

              <div className="p-2 space-y-1.5 flex-1">
                {dayItems.length === 0 && (
                  <p className="text-xs text-[#6b6b6b] px-1 py-2">-</p>
                )}

                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-1.5 rounded text-xs ${TYPE_META[item.type].block}`}
                    title={`${resolveDisplay(item.title, t)} • ${resolveDisplay(item.subtitle, t)}`}
                  >
                    <div className="truncate">{item.startTime}</div>
                    <div className="truncate">{resolveDisplay(item.title, t)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayDetailCard({
  item,
  isStudentView,
  rescheduleStatus,
  onRequestReschedule,
}: {
  item: CalendarItem;
  isStudentView: boolean;
  rescheduleStatus?: string;
  onRequestReschedule: (item: CalendarItem) => void;
}) {
  const { t } = useLanguage();
  const meta = TYPE_META[item.type];
  const canRequestReschedule =
    isStudentView && item.type !== 'event' && !!item.calendarEventId;

  return (
    <div className="border border-[rgba(40,67,66,0.1)] rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="text-sm text-[#284342]">{resolveDisplay(item.title, t)}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.badge}`}>
          {getTypeLabel(item.type, t)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-[#6b6b6b]">
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          {item.startTime} - {item.endTime}
        </span>

        <span className="flex items-center gap-1.5">
          <User size={13} />
          {resolveDisplay(item.subtitle, t)}
        </span>

        {item.location !== '-' && (
          <span className="flex items-center gap-1.5">
            <MapPin size={13} />
            {resolveDisplay(item.location, t)}
          </span>
        )}
      </div>

      <p className="text-[11px] text-[#6b6b6b] mt-2">
        {t('unifiedCalendar.statusLabel', { status: getStatusLabel(item.status, t) })}
      </p>

      {canRequestReschedule && (
        <div className="mt-3 pt-3 border-t border-[rgba(40,67,66,0.1)]">
          {rescheduleStatus ? (
            <span
              className={`text-[11px] px-2 py-1 rounded-full ${
                rescheduleStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : rescheduleStatus === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {t('unifiedCalendar.rescheduleStatus', { status: getStatusLabel(rescheduleStatus, t) })}
            </span>
          ) : (
            <button
              onClick={() => onRequestReschedule(item)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
            >
              {t('unifiedCalendar.requestReschedule')}
            </button>
          )}
        </div>
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
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays size={16} className="text-[#6b6b6b]" />
        <p className="text-sm text-[#6b6b6b]">{label}</p>
      </div>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return days;
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFullDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTeacherName(teacher: any) {
  if (!teacher) return '-';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;
  if (!actualTeacher) return '-';

  const users = actualTeacher.users;
  const actualUser = Array.isArray(users) ? users[0] : users;

  return actualUser?.full_name || actualTeacher.specialization || '-';
}

function getStudentName(student: any) {
  if (!student) return '-';
  if (Array.isArray(student)) return student[0]?.full_name || '-';
  return student.full_name || '-';
}
