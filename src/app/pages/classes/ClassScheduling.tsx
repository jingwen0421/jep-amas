import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../services/unifiedNotificationService';
import { useLanguage } from '../../context/LanguageContext';

interface ScheduledClass {
  id: string;
  course: string;
  courseId: string | null;
  moduleTitle: string;
  moduleId: string | null;
  batchId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  teacher: string;
  teacherId: string | null;
  room: string;
  classroomId: string | null;
  rawTitle: string;
  participantCount: number;
  status: 'Scheduled' | 'Completed';
  teacherConfirmed: boolean;
}

interface CourseOption {
  id: string;
  course_name: string;
}

interface ModuleOption {
  id: string;
  title: string;
  sequence: number;
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

interface SyncConflict {
  id: string;
  source_table: string;
  source_id: string;
  conflict_message: string;
  detected_at: string;
}

interface RosterPoolMember {
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  moduleStatus: string;
}

interface RosterMember {
  studentId: string;
  studentName: string;
  source: 'batch' | 'individual' | 'auto_eligible';
}

const emptyFormData = {
  courseId: '',
  moduleId: '',
  teacherId: '',
  classroomId: '',
  date: '',
  startTime: '',
  endTime: '',
  lessonTitle: '',
};

export default function ClassScheduling() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('Current Week');

  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const visibleScheduledClasses = useMemo(() => {
    const range = getScheduleViewRange(selectedWeek);
    return scheduledClasses.filter(
      (c) => c.date >= range.start && c.date <= range.end
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledClasses, selectedWeek]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [loadingConflicts, setLoadingConflicts] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const conflictRequestIdRef = useRef(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(
    null
  );

  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  const [courseBatches, setCourseBatches] = useState<
    { id: string; batch_name: string }[]
  >([]);
  const [rosterPool, setRosterPool] = useState<RosterPoolMember[]>([]);
  const [rosterPoolLoading, setRosterPoolLoading] = useState(false);
  const [roster, setRoster] = useState<Map<string, RosterMember>>(new Map());
  const [primaryBatchId, setPrimaryBatchId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [viewingClass, setViewingClass] = useState<ScheduledClass | null>(null);
  const [viewingRoster, setViewingRoster] = useState<string[]>([]);
  const [viewingRosterLoading, setViewingRosterLoading] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  const [formData, setFormData] = useState(emptyFormData);

  useEffect(() => {
    fetchAll();
  }, []);

  // Deep-link support: the Unified Calendar's "+ Schedule Class" quick
  // action lands here with ?date=YYYY-MM-DD instead of duplicating the
  // roster/conflict-check logic in its own modal — open straight into the
  // create form with that date pre-filled.
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam) return;

    openCreateModal(dateParam);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('date');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!showScheduleModal || !formData.courseId) {
      setModules([]);
      setCourseBatches([]);
      setRosterPool([]);
      return;
    }

    fetchModulesForCourse(formData.courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScheduleModal, formData.courseId]);

  useEffect(() => {
    if (!showScheduleModal || !formData.courseId) return;
    fetchRosterPool(formData.courseId, formData.moduleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScheduleModal, formData.courseId, formData.moduleId]);

  useEffect(() => {
    if (!showScheduleModal) return;

    if (
      !formData.date ||
      !formData.startTime ||
      !formData.endTime ||
      calculateDurationMinutes(formData.startTime, formData.endTime) <= 0
    ) {
      setConflictWarnings([]);
      setAvailabilityWarning(null);
      return;
    }

    const handle = setTimeout(() => {
      if (formData.teacherId || formData.classroomId) checkConflicts();
      if (formData.teacherId) checkAvailability();
      if (!formData.teacherId) setAvailabilityWarning(null);
    }, 350);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showScheduleModal,
    editingLessonId,
    formData.teacherId,
    formData.classroomId,
    formData.date,
    formData.startTime,
    formData.endTime,
  ]);

  async function fetchAll() {
    await Promise.all([
      fetchScheduledClasses(),
      fetchCourses(),
      fetchTeachers(),
      fetchClassrooms(),
      fetchSyncConflicts(),
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
        batch_id,
        teacher_id,
        classroom_id,
        module_id,
        teacher_confirmed_at,
        course_modules(title, course_id, courses(course_name)),
        class_batches(batch_name, courses(course_name)),
        teachers(specialization, users(full_name)),
        classrooms(room_name),
        lesson_participants(id)
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

      const moduleJoin = getSingle(lesson.course_modules);
      const batchJoin = getSingle(lesson.class_batches);
      const moduleCourse = moduleJoin ? getSingle(moduleJoin.courses) : null;
      const batchCourse = batchJoin ? getSingle(batchJoin.courses) : null;

      return {
        id: lesson.id,
        course: moduleCourse?.course_name || batchCourse?.course_name || '-',
        courseId: moduleJoin?.course_id || null,
        moduleTitle: moduleJoin?.title || '-',
        moduleId: lesson.module_id || null,
        batchId: lesson.batch_id || null,
        date: start.toISOString().slice(0, 10),
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        teacher: getTeacherNameFromJoin(lesson.teachers),
        teacherId: lesson.teacher_id || null,
        room: lesson.classrooms?.room_name || '-',
        classroomId: lesson.classroom_id || null,
        rawTitle: lesson.lesson_title || '',
        participantCount: (lesson.lesson_participants || []).length,
        status: start < new Date() ? 'Completed' : 'Scheduled',
        teacherConfirmed: !!lesson.teacher_confirmed_at,
      };
    });

    setScheduledClasses(mapped);
    setLoading(false);
  }

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('status', 'active')
      .order('course_name', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error.message);
      return;
    }

    setCourses(data || []);
  }

  async function fetchModulesForCourse(courseId: string) {
    setModulesLoading(true);

    const { data, error } = await supabase
      .from('course_modules')
      .select('id, title, sequence')
      .eq('course_id', courseId)
      .order('sequence', { ascending: true });

    setModulesLoading(false);

    if (error) {
      console.error('Error fetching modules:', error.message);
      return;
    }

    setModules(data || []);
  }

  async function fetchRosterPool(courseId: string, moduleId: string) {
    setRosterPoolLoading(true);

    const { data: batchRows, error: batchError } = await supabase
      .from('class_batches')
      .select('id, batch_name')
      .eq('course_id', courseId)
      .order('batch_name', { ascending: true });

    if (batchError) {
      console.error('Error fetching batches for course:', batchError.message);
      setRosterPoolLoading(false);
      return;
    }

    setCourseBatches(batchRows || []);

    const batchIds = (batchRows || []).map((b) => b.id);

    if (batchIds.length === 0) {
      setRosterPool([]);
      setRosterPoolLoading(false);
      return;
    }

    const { data: enrollRows, error: enrollError } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        student_id,
        batch_id,
        enrollment_status,
        students(full_name),
        class_batches(batch_name)
      `
      )
      .in('batch_id', batchIds)
      .eq('enrollment_status', 'active');

    if (enrollError) {
      console.error('Error fetching course roster pool:', enrollError.message);
      setRosterPoolLoading(false);
      return;
    }

    let progressByEnrollment: Record<string, string> = {};

    if (moduleId && enrollRows && enrollRows.length > 0) {
      const { data: progressRows, error: progressError } = await supabase
        .from('student_module_progress')
        .select('enrollment_id, status')
        .eq('module_id', moduleId)
        .in(
          'enrollment_id',
          enrollRows.map((row) => row.id)
        );

      if (!progressError) {
        (progressRows || []).forEach((row: any) => {
          progressByEnrollment[row.enrollment_id] = row.status;
        });
      }
    }

    setRosterPool(
      (enrollRows || []).map((row: any) => ({
        studentId: row.student_id,
        studentName: getSingle(row.students)?.full_name || 'Student',
        batchId: row.batch_id,
        batchName: getSingle(row.class_batches)?.batch_name || '-',
        moduleStatus: progressByEnrollment[row.id] || 'eligible',
      }))
    );

    setRosterPoolLoading(false);
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

  async function fetchSyncConflicts() {
    setLoadingConflicts(true);

    const { data, error } = await supabase
      .from('calendar_sync_conflicts')
      .select('id, source_table, source_id, conflict_message, detected_at')
      .order('detected_at', { ascending: false });

    if (error) {
      console.error('Error fetching sync conflicts:', error.message);
      setLoadingConflicts(false);
      return;
    }

    setSyncConflicts(data || []);
    setLoadingConflicts(false);
  }

  async function dismissConflict(id: string) {
    setDismissingId(id);

    const { error } = await supabase
      .from('calendar_sync_conflicts')
      .delete()
      .eq('id', id);

    setDismissingId(null);

    if (error) {
      console.error('Error dismissing conflict:', error.message);
      return;
    }

    setSyncConflicts((prev) => prev.filter((conflict) => conflict.id !== id));
  }

  function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }

  // "View Schedule" dropdown previously only changed its own label — the
  // list below always rendered every scheduled class regardless of which
  // option was picked. This computes the actual [start, end] date window
  // for each option so the list can be filtered against it.
  function getScheduleViewRange(view: string): { start: string; end: string } {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (view === 'Current Week' || view === 'Next Week') {
      const day = startOfToday.getDay(); // 0 = Sun .. 6 = Sat
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(startOfToday);
      monday.setDate(startOfToday.getDate() + diffToMonday);

      if (view === 'Next Week') monday.setDate(monday.getDate() + 7);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return { start: toDateStr(monday), end: toDateStr(sunday) };
    }

    const monthOffset = view === 'Next Month' ? 1 : 0;
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);

    return { start: toDateStr(firstOfMonth), end: toDateStr(lastOfMonth) };
  }

  function calculateDurationMinutes(startTime: string, endTime: string) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    return eh * 60 + em - (sh * 60 + sm);
  }

  async function checkConflicts() {
    setCheckingConflicts(true);

    // Snapshot state at call time and stamp this call with a request id.
    // checkConflicts is debounced (350ms) and can overlap with itself (e.g.
    // switching from "Schedule New" straight into "Edit" on an existing
    // class before the previous check has resolved) — without this guard a
    // stale, in-flight response for the OLD editingLessonId/formData could
    // land after the fresh one and overwrite it with wrong warnings,
    // including a class appearing to conflict with itself.
    const requestId = ++conflictRequestIdRef.current;
    const currentEditingLessonId = editingLessonId;

    const startsAt = `${formData.date}T${formData.startTime}:00+08:00`;
    const endsAt = `${formData.date}T${formData.endTime}:00+08:00`;
    const warnings: string[] = [];

    // Exclude the lesson being edited at the query level (not just by
    // filtering the result client-side) so its own calendar_events row can
    // never be reported as a conflict with itself.
    if (formData.teacherId) {
      let query = supabase
        .from('calendar_events')
        .select('title, starts_at, ends_at, source_table, source_id')
        .eq('teacher_id', formData.teacherId)
        .neq('status', 'cancelled')
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt);

      if (currentEditingLessonId) {
        // source_id is a uuid, effectively globally unique across every
        // table calendar_events pulls from, so excluding by source_id alone
        // (without also matching source_table) is safe and avoids relying
        // on PostgREST's less-common not(and(...)) compound-filter syntax.
        query = query.neq('source_id', currentEditingLessonId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const clash = data[0];
        const teacherOption = teachers.find((t) => t.id === formData.teacherId);
        const teacherName = teacherOption ? getTeacherName(teacherOption) : 'Selected teacher';
        warnings.push(
          `${teacherName} already has "${clash.title}" booked ${formatRange(clash.starts_at, clash.ends_at)}.`
        );
      }
    }

    if (formData.classroomId) {
      let query = supabase
        .from('calendar_events')
        .select('title, starts_at, ends_at, source_table, source_id')
        .eq('venue_id', formData.classroomId)
        .neq('status', 'cancelled')
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt);

      if (currentEditingLessonId) {
        // source_id is a uuid, effectively globally unique across every
        // table calendar_events pulls from, so excluding by source_id alone
        // (without also matching source_table) is safe and avoids relying
        // on PostgREST's less-common not(and(...)) compound-filter syntax.
        query = query.neq('source_id', currentEditingLessonId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const clash = data[0];
        const roomName =
          classrooms.find((c) => c.id === formData.classroomId)?.room_name || 'Selected room';
        warnings.push(
          `${roomName} is already booked for "${clash.title}" ${formatRange(clash.starts_at, clash.ends_at)}.`
        );
      }
    }

    if (requestId === conflictRequestIdRef.current) {
      setConflictWarnings(warnings);
      setCheckingConflicts(false);
    }
  }

  async function checkAvailability() {
    if (!formData.teacherId || !formData.date) {
      setAvailabilityWarning(null);
      return;
    }

    // teacher_availability rows now mean "this teacher marked themselves
    // UNAVAILABLE for this window" (outstation on another job, a personal
    // appointment, etc) rather than the old opt-in "these are my free
    // hours" model — a teacher with no rows at all for this date is simply
    // assumed open, so absence of data is no longer itself a warning.
    const { data, error } = await supabase
      .from('teacher_availability')
      .select('start_time, end_time, reason')
      .eq('teacher_id', formData.teacherId)
      .eq('available_date', formData.date);

    if (error) {
      setAvailabilityWarning(null);
      return;
    }

    const teacherOption = teachers.find((t) => t.id === formData.teacherId);
    const teacherName = teacherOption ? getTeacherName(teacherOption) : 'This teacher';

    const blockingSlot = (data || []).find(
      (slot) =>
        (slot.start_time || '').slice(0, 5) < formData.endTime &&
        (slot.end_time || '').slice(0, 5) > formData.startTime
    );

    setAvailabilityWarning(
      blockingSlot
        ? `${teacherName} marked themselves unavailable for this time${
            blockingSlot.reason ? ` (${blockingSlot.reason})` : ''
          }.`
        : null
    );
  }

  function addBatchToRoster(batchId: string) {
    setRoster((prev) => {
      const next = new Map(prev);
      rosterPool
        .filter((member) => member.batchId === batchId)
        .forEach((member) =>
          next.set(member.studentId, {
            studentId: member.studentId,
            studentName: member.studentName,
            source: 'batch',
          })
        );
      return next;
    });
    setPrimaryBatchId(batchId);
  }

  function addAutoEligible() {
    setRoster((prev) => {
      const next = new Map(prev);
      rosterPool
        .filter((member) => member.moduleStatus !== 'completed')
        .forEach((member) =>
          next.set(member.studentId, {
            studentId: member.studentId,
            studentName: member.studentName,
            source: 'auto_eligible',
          })
        );
      return next;
    });
    setPrimaryBatchId(null);
  }

  function addIndividualToRoster(member: RosterPoolMember) {
    setRoster((prev) => {
      const next = new Map(prev);
      next.set(member.studentId, {
        studentId: member.studentId,
        studentName: member.studentName,
        source: 'individual',
      });
      return next;
    });
    setPrimaryBatchId(null);
    setStudentSearch('');
  }

  function removeFromRoster(studentId: string) {
    setRoster((prev) => {
      const next = new Map(prev);
      next.delete(studentId);
      return next;
    });
  }

  function openCreateModal(prefillDate?: string) {
    setEditingLessonId(null);
    setFormError(null);
    setConflictWarnings([]);
    setAvailabilityWarning(null);
    setRoster(new Map());
    setPrimaryBatchId(null);
    setStudentSearch('');
    setFormData(
      prefillDate ? { ...emptyFormData, date: prefillDate } : emptyFormData
    );
    setShowScheduleModal(true);
  }

  async function openEditModal(classItem: ScheduledClass) {
    setEditingLessonId(classItem.id);
    setFormError(null);
    setConflictWarnings([]);
    setAvailabilityWarning(null);
    setStudentSearch('');
    setPrimaryBatchId(classItem.batchId);

    setFormData({
      courseId: classItem.courseId || '',
      moduleId: classItem.moduleId || '',
      teacherId: classItem.teacherId || '',
      classroomId: classItem.classroomId || '',
      date: classItem.date,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      lessonTitle: classItem.rawTitle,
    });

    const { data, error } = await supabase
      .from('lesson_participants')
      .select('student_id, source, students(full_name)')
      .eq('lesson_id', classItem.id);

    if (!error) {
      const next = new Map<string, RosterMember>();
      (data || []).forEach((row: any) => {
        next.set(row.student_id, {
          studentId: row.student_id,
          studentName: getSingle(row.students)?.full_name || 'Student',
          source: row.source,
        });
      });
      setRoster(next);
    }

    setShowScheduleModal(true);
  }

  async function openViewDetails(classItem: ScheduledClass) {
    setViewingClass(classItem);
    setViewingRoster([]);
    setViewingRosterLoading(true);

    const { data, error } = await supabase
      .from('lesson_participants')
      .select('student_id, students(full_name)')
      .eq('lesson_id', classItem.id);

    if (!error) {
      setViewingRoster(
        (data || []).map(
          (row: any) => getSingle(row.students)?.full_name || 'Student'
        )
      );
    }

    setViewingRosterLoading(false);
  }

  async function sendClassReminder(classItem: ScheduledClass) {
    setSendingReminderId(classItem.id);

    const { data: participants, error } = await supabase
      .from('lesson_participants')
      .select('students(user_id, full_name, email, phone)')
      .eq('lesson_id', classItem.id);

    if (error) {
      alert(t('classScheduling.alert.loadRosterFailed', { message: error.message }));
      setSendingReminderId(null);
      return;
    }

    const targets = (participants || [])
      .map((row: any) => getSingle(row.students))
      .filter((student: any) => !!student);

    if (targets.length === 0) {
      alert(t('classScheduling.alert.noStudentsToRemind'));
      setSendingReminderId(null);
      return;
    }

    const message = t('classScheduling.reminderMessage', {
      course: classItem.course,
      module: classItem.moduleTitle,
      date: classItem.date,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      room: classItem.room,
    });

    await Promise.all(
      targets.map((student: any) =>
        notify({
          target: {
            userId: student.user_id || null,
            name: student.full_name,
            email: student.email,
            phone: student.phone,
          },
          channels: ['in_app', 'email'],
          title: t('classScheduling.reminderTitle'),
          message,
          type: 'class_reminder',
          relatedModule: 'Class Scheduling',
          relatedId: classItem.id,
        })
      )
    );

    setSendingReminderId(null);
    alert(t('classScheduling.alert.reminderSent', { count: targets.length }));
  }

  function closeModal() {
    setShowScheduleModal(false);
    setEditingLessonId(null);
    setFormError(null);
    setConflictWarnings([]);
    setAvailabilityWarning(null);
    setRoster(new Map());
    setPrimaryBatchId(null);
    setStudentSearch('');
    setFormData(emptyFormData);
  }

  async function scheduleClass() {
    setFormError(null);

    if (!formData.moduleId) {
      setFormError(t('classScheduling.error.selectModule'));
      return;
    }

    if (roster.size === 0) {
      setFormError(t('classScheduling.error.addStudent'));
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      setFormError(t('classScheduling.error.selectDateTime'));
      return;
    }

    const durationMinutes = calculateDurationMinutes(
      formData.startTime,
      formData.endTime
    );

    if (durationMinutes <= 0) {
      setFormError(t('classScheduling.error.endAfterStart'));
      return;
    }

    const lessonDateTime = `${formData.date}T${formData.startTime}:00+08:00`;
    const selectedModule = modules.find((m) => m.id === formData.moduleId);
    const lessonTitle = formData.lessonTitle.trim() || selectedModule?.title || 'Scheduled Class';

    setSaving(true);

    let lessonId = editingLessonId;

    if (editingLessonId) {
      const { error } = await supabase
        .from('lessons')
        .update({
          teacher_id: formData.teacherId || null,
          classroom_id: formData.classroomId || null,
          lesson_title: lessonTitle,
          lesson_datetime: lessonDateTime,
          duration_minutes: durationMinutes,
          module_id: formData.moduleId,
          batch_id: primaryBatchId,
          // Any edit to a scheduled class re-opens teacher confirmation —
          // whatever was changed, the teacher should acknowledge the
          // current version rather than an implicitly-carried-over one.
          teacher_confirmed_at: null,
        })
        .eq('id', editingLessonId);

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error } = await supabase
        .from('lessons')
        .insert({
          batch_id: primaryBatchId,
          module_id: formData.moduleId,
          teacher_id: formData.teacherId || null,
          classroom_id: formData.classroomId || null,
          lesson_title: lessonTitle,
          lesson_objective: selectedModule ? `Module: ${selectedModule.title}` : 'Scheduled class session',
          lesson_datetime: lessonDateTime,
          duration_minutes: durationMinutes,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }

      lessonId = inserted.id;
    }

    await supabase.from('lesson_participants').delete().eq('lesson_id', lessonId);

    const rosterRows = Array.from(roster.values()).map((member) => ({
      lesson_id: lessonId,
      student_id: member.studentId,
      source: member.source,
    }));

    const { error: rosterError } = await supabase
      .from('lesson_participants')
      .insert(rosterRows);

    setSaving(false);

    if (rosterError) {
      setFormError(t('classScheduling.error.rosterSaveFailed', { message: rosterError.message }));
      fetchScheduledClasses();
      return;
    }

    closeModal();
    fetchScheduledClasses();
    fetchSyncConflicts();
  }

  function getViewLabel(view: string) {
    switch (view) {
      case 'Current Week':
        return t('classScheduling.view.currentWeek');
      case 'Next Week':
        return t('classScheduling.view.nextWeek');
      case 'This Month':
        return t('classScheduling.view.thisMonth');
      case 'Next Month':
        return t('classScheduling.view.nextMonth');
      default:
        return view;
    }
  }

  const filteredRosterCandidates = studentSearch.trim()
    ? rosterPool
        .filter(
          (member) =>
            !roster.has(member.studentId) &&
            member.studentName.toLowerCase().includes(studentSearch.trim().toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('classScheduling.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('classScheduling.subtitle')}
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          {t('classScheduling.scheduleClass')}
        </button>
      </div>

      {!loadingConflicts && syncConflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-700 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm text-yellow-900 mb-3">
                {t('classScheduling.conflictsDetected', { count: syncConflicts.length })}
              </h3>

              <div className="space-y-2">
                {syncConflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="flex items-start justify-between gap-3 bg-white/60 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm text-yellow-900">
                        <strong className="capitalize">
                          {conflict.source_table.replace(/_/g, ' ')}
                        </strong>
                        : {conflict.conflict_message}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {t('classScheduling.detected', { date: new Date(conflict.detected_at).toLocaleString() })}
                      </p>
                    </div>

                    <button
                      onClick={() => dismissConflict(conflict.id)}
                      disabled={dismissingId === conflict.id}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-yellow-300 text-yellow-900 hover:bg-yellow-100 transition-colors text-xs disabled:opacity-50"
                    >
                      {dismissingId === conflict.id ? t('classScheduling.dismissing') : t('classScheduling.dismiss')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-4">
          <label className="text-sm text-[#284342]">{t('classScheduling.viewSchedule')}</label>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            <option value="Current Week">{t('classScheduling.view.currentWeek')}</option>
            <option value="Next Week">{t('classScheduling.view.nextWeek')}</option>
            <option value="This Month">{t('classScheduling.view.thisMonth')}</option>
            <option value="Next Month">{t('classScheduling.view.nextMonth')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            {t('classScheduling.scheduledClassesFor', { view: getViewLabel(selectedWeek) })}
          </h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('classScheduling.loadingScheduled')}
            </div>
          )}

          {!loading && visibleScheduledClasses.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {scheduledClasses.length === 0
                ? t('classScheduling.noneFound')
                : t('classScheduling.noneInView', { view: getViewLabel(selectedWeek).toLowerCase() })}
            </div>
          )}

          {!loading &&
            visibleScheduledClasses.map((classItem) => (
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
                        {classItem.moduleTitle}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          classItem.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {classItem.status === 'Scheduled'
                          ? t('classScheduling.status.scheduled')
                          : t('classScheduling.status.completed')}
                      </span>

                      {classItem.teacherId && (
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            classItem.teacherConfirmed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {classItem.teacherConfirmed
                            ? t('classScheduling.confirmedByTeacher')
                            : t('classScheduling.awaitingConfirmation')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <Info
                        icon={<Calendar size={14} />}
                        label={t('classScheduling.field.date')}
                        value={classItem.date}
                      />
                      <Info
                        icon={<Clock size={14} />}
                        label={t('classScheduling.field.time')}
                        value={`${classItem.startTime} - ${classItem.endTime}`}
                      />
                      <Info
                        icon={<Users size={14} />}
                        label={t('classScheduling.field.teacher')}
                        value={classItem.teacher}
                      />
                      <Info
                        icon={<MapPin size={14} />}
                        label={t('classScheduling.field.room')}
                        value={classItem.room}
                      />
                      <Info
                        icon={<Users size={14} />}
                        label={t('classScheduling.field.roster')}
                        value={classItem.participantCount.toString()}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  <button
                    onClick={() => openViewDetails(classItem)}
                    className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                  >
                    {t('classScheduling.viewDetails')}
                  </button>

                  <button
                    onClick={() => openEditModal(classItem)}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                  >
                    {t('classScheduling.editSchedule')}
                  </button>

                  <button
                    onClick={() => sendClassReminder(classItem)}
                    disabled={sendingReminderId === classItem.id}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm disabled:opacity-50"
                  >
                    {sendingReminderId === classItem.id
                      ? t('classScheduling.sending')
                      : t('classScheduling.sendReminder')}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl text-[#284342] mb-6">
              {editingLessonId ? t('classScheduling.editClassSchedule') : t('classScheduling.scheduleNewClass')}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    {t('classScheduling.field.course')}
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        courseId: e.target.value,
                        moduleId: '',
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  >
                    <option value="">{t('classScheduling.selectCourse')}</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    {t('classScheduling.field.module')}
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, moduleId: e.target.value }))
                    }
                    disabled={!formData.courseId || modulesLoading}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342] disabled:opacity-50"
                  >
                    <option value="">
                      {modulesLoading ? t('classScheduling.loadingEllipsis') : t('classScheduling.selectModule')}
                    </option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.sequence}. {module.title}
                      </option>
                    ))}
                  </select>
                  {formData.courseId && !modulesLoading && modules.length === 0 && (
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      {t('classScheduling.noModulesDefined')}
                    </p>
                  )}
                </div>
              </div>

              {formData.courseId && (
                <div className="p-4 bg-[#f8f8f6] rounded-lg border border-[rgba(40,67,66,0.1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#284342]">{t('classScheduling.studentRoster')}</p>
                    <span className="text-xs text-[#6b6b6b]">
                      {t('classScheduling.selectedCount', { count: roster.size })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {courseBatches.map((batch) => (
                      <button
                        key={batch.id}
                        onClick={() => addBatchToRoster(batch.id)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-white transition-colors"
                      >
                        {t('classScheduling.addBatch', { name: batch.batch_name })}
                      </button>
                    ))}

                    {formData.moduleId && (
                      <button
                        onClick={addAutoEligible}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#284342]/30 bg-[#284342]/5 text-[#284342] hover:bg-[#284342]/10 transition-colors"
                      >
                        {t('classScheduling.autoFillEligible')}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                    />
                    <input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={t('classScheduling.addStudentPlaceholder')}
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342] text-sm"
                    />

                    {filteredRosterCandidates.length > 0 && (
                      <div className="mt-1 bg-white border border-[rgba(40,67,66,0.15)] rounded-lg overflow-hidden">
                        {filteredRosterCandidates.map((member) => (
                          <button
                            key={member.studentId}
                            onClick={() => addIndividualToRoster(member)}
                            className="w-full text-left px-3 py-2 text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center justify-between"
                          >
                            <span>{member.studentName}</span>
                            <span className="text-xs text-[#6b6b6b]">
                              {member.batchName}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {rosterPoolLoading && (
                    <p className="text-xs text-[#6b6b6b]">
                      {t('classScheduling.loadingCourseRoster')}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {roster.size === 0 && (
                      <p className="text-xs text-[#6b6b6b]">
                        {t('classScheduling.noStudentsAdded')}
                      </p>
                    )}

                    {Array.from(roster.values()).map((member) => (
                      <span
                        key={member.studentId}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white border border-[rgba(40,67,66,0.15)] text-[#284342]"
                      >
                        {member.studentName}
                        <button
                          onClick={() => removeFromRoster(member.studentId)}
                          className="text-[#6b6b6b] hover:text-red-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('classScheduling.sessionTitleOptional')}
                </label>

                <input
                  value={formData.lessonTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lessonTitle: e.target.value,
                    }))
                  }
                  placeholder={t('classScheduling.sessionTitlePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label={t('classScheduling.field.date')}
                  type="date"
                  value={formData.date}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, date: value }))
                  }
                />

                <Input
                  label={t('classScheduling.field.startTime')}
                  type="time"
                  value={formData.startTime}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startTime: value }))
                  }
                />

                <Input
                  label={t('classScheduling.field.endTime')}
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
                    {t('classScheduling.field.teacher')}
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
                    <option value="">{t('classScheduling.selectTeacher')}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {getTeacherName(teacher)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    {t('classScheduling.field.classroom')}
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
                    <option value="">{t('classScheduling.selectRoom')}</option>
                    {classrooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {checkingConflicts && (
                <div className="p-4 bg-[#f8f8f6] border border-[rgba(40,67,66,0.15)] rounded-lg">
                  <p className="text-sm text-[#6b6b6b]">
                    {t('classScheduling.checkingConflicts')}
                  </p>
                </div>
              )}

              {!checkingConflicts && conflictWarnings.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-1">
                  {conflictWarnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-red-800">
                      <strong>{t('classScheduling.conflictLabel')}</strong> {warning}
                    </p>
                  ))}
                </div>
              )}

              {availabilityWarning && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>{t('classScheduling.headsUp')}</strong> {availabilityWarning}
                  </p>
                </div>
              )}

              {!checkingConflicts &&
                conflictWarnings.length === 0 &&
                !availabilityWarning &&
                (formData.teacherId || formData.classroomId) &&
                formData.date &&
                formData.startTime &&
                formData.endTime && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>{t('classScheduling.conflictCheckLabel')}</strong> {t('classScheduling.noConflictsDetected')}
                    </p>
                  </div>
                )}

              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('classScheduling.cancel')}
              </button>

              <button
                onClick={scheduleClass}
                disabled={saving}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
              >
                {saving
                  ? t('classScheduling.saving')
                  : editingLessonId
                    ? t('classScheduling.saveChanges')
                    : t('classScheduling.scheduleClass')}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl text-[#284342] mb-1">
              {viewingClass.course}
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-6">
              {viewingClass.moduleTitle}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <Info
                icon={<Calendar size={14} />}
                label={t('classScheduling.field.date')}
                value={viewingClass.date}
              />
              <Info
                icon={<Clock size={14} />}
                label={t('classScheduling.field.time')}
                value={`${viewingClass.startTime} - ${viewingClass.endTime}`}
              />
              <Info
                icon={<Users size={14} />}
                label={t('classScheduling.field.teacher')}
                value={viewingClass.teacher}
              />
              <Info
                icon={<MapPin size={14} />}
                label={t('classScheduling.field.room')}
                value={viewingClass.room}
              />
            </div>

            <p className="text-xs text-[#6b6b6b] mb-2">
              {t('classScheduling.rosterCount', { count: viewingClass.participantCount })}
            </p>

            {viewingRosterLoading && (
              <p className="text-sm text-[#6b6b6b]">{t('classScheduling.loadingRoster')}</p>
            )}

            {!viewingRosterLoading && viewingRoster.length === 0 && (
              <p className="text-sm text-[#6b6b6b]">
                {t('classScheduling.noStudentsOnRoster')}
              </p>
            )}

            {!viewingRosterLoading && viewingRoster.length > 0 && (
              <div className="space-y-2">
                {viewingRoster.map((name, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#f8f8f6] text-sm text-[#284342]"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setViewingClass(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('classScheduling.close')}
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

function getTeacherName(teacher: TeacherOption) {
  const users = teacher.users;

  if (Array.isArray(users)) {
    return users[0]?.full_name || teacher.specialization || '-';
  }

  return users?.full_name || teacher.specialization || '-';
}

function getTeacherNameFromJoin(
  teacher?: TeacherOption[] | TeacherOption | null
) {
  if (!teacher) return '-';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;

  if (!actualTeacher) return '-';

  return getTeacherName(actualTeacher);
}

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const dateStr = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const startStr = start.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endStr = end.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dateStr}, ${startStr}–${endStr}`;
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}
