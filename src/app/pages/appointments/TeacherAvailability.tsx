import { useEffect, useState } from 'react';
import { Clock, Calendar, XCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentTeacherId } from '../../utils/teacherAccess';
import { useLanguage } from '../../context/LanguageContext';

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

interface TimeSlot {
  id: string;
  dayKey: string;
  time: string;
  reason: string | null;
}

interface TeacherSchedule {
  teacher: string;
  slots: TimeSlot[];
}

interface MySlot {
  id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export default function TeacherAvailability() {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const isTeacherView =
    currentUser.role === 'teacher' || currentUser.role === 'assistant_teacher';

  const [teachers, setTeachers] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);
  const [mySlots, setMySlots] = useState<MySlot[]>([]);
  const [mySlotsLoading, setMySlotsLoading] = useState(isTeacherView);
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
    if (isTeacherView) fetchMySlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        reason,
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
      const teacherName = getTeacherName(slot.teachers, t);
      const date = new Date(slot.available_date);
      const dayKey = WEEKDAY_KEYS[date.getDay()];

      if (!grouped[teacherName]) grouped[teacherName] = [];

      grouped[teacherName].push({
        id: slot.id,
        dayKey,
        time: `${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}`,
        reason: slot.reason || null,
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

  async function fetchMySlots() {
    setMySlotsLoading(true);

    const teacherId = await getCurrentTeacherId();
    setMyTeacherId(teacherId || null);

    if (!teacherId) {
      setMySlotsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('teacher_availability')
      .select('id, available_date, start_time, end_time, reason')
      .eq('teacher_id', teacherId)
      .order('available_date', { ascending: true });

    if (error) {
      console.error('Error fetching my availability:', error.message);
      setMySlotsLoading(false);
      return;
    }

    setMySlots(data || []);
    setMySlotsLoading(false);
  }

  async function addSlot() {
    setAddError(null);

    if (!myTeacherId) {
      setAddError(t('teacherAvailability.error.noTeacherProfile'));
      return;
    }

    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      setAddError(t('teacherAvailability.error.pickDateTimes'));
      return;
    }

    if (newSlot.endTime <= newSlot.startTime) {
      setAddError(t('teacherAvailability.error.endAfterStart'));
      return;
    }

    setAdding(true);

    const { error } = await supabase.from('teacher_availability').insert({
      teacher_id: myTeacherId,
      available_date: newSlot.date,
      start_time: newSlot.startTime,
      end_time: newSlot.endTime,
      reason: newSlot.reason.trim() || null,
      status: 'active',
    });

    setAdding(false);

    if (error) {
      setAddError(error.message);
      return;
    }

    setNewSlot({ date: '', startTime: '', endTime: '', reason: '' });
    fetchMySlots();
    fetchAvailability();
  }

  async function deleteSlot(slotId: string) {
    setDeletingSlotId(slotId);

    const { error } = await supabase
      .from('teacher_availability')
      .delete()
      .eq('id', slotId);

    setDeletingSlotId(null);

    if (error) {
      console.error('Error deleting availability slot:', error.message);
      return;
    }

    fetchMySlots();
    fetchAvailability();
  }

  const totalTeachers = teachers.length;

  const totalBlockedWindows = teachers.reduce(
    (acc, teacher) => acc + teacher.slots.length,
    0
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcomingMyBlocks = mySlots.filter((slot) => slot.available_date >= today).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('teacherAvailability.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {isTeacherView
            ? t('teacherAvailability.subtitle.teacher')
            : t('teacherAvailability.subtitle.admin')}
        </p>
      </div>

      {isTeacherView && (
        <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
          <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
            <h2 className="text-lg text-[#284342]">{t('teacherAvailability.markUnavailable.title')}</h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">{t('teacherAvailability.field.date')}</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) =>
                    setNewSlot((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">
                  {t('teacherAvailability.field.startTime')}
                </label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) =>
                    setNewSlot((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">
                  {t('teacherAvailability.field.endTime')}
                </label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) =>
                    setNewSlot((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <button
                onClick={addSlot}
                disabled={adding}
                className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} />
                {adding ? t('teacherAvailability.adding') : t('teacherAvailability.markUnavailableButton')}
              </button>
            </div>

            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">
                {t('teacherAvailability.field.reasonOptional')}
              </label>
              <input
                value={newSlot.reason}
                onChange={(e) =>
                  setNewSlot((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder={t('teacherAvailability.field.reasonPlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{addError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mySlotsLoading && (
                <p className="text-sm text-[#6b6b6b] col-span-full">
                  {t('teacherAvailability.loadingMySlots')}
                </p>
              )}

              {!mySlotsLoading && mySlots.length === 0 && (
                <p className="text-sm text-[#6b6b6b] col-span-full">
                  {t('teacherAvailability.noMySlots')}
                </p>
              )}

              {!mySlotsLoading &&
                mySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-lg border border-[rgba(40,67,66,0.15)] bg-[#f8f8f6] flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm text-[#284342]">
                        {new Date(`${slot.available_date}T00:00:00`).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric', weekday: 'short' }
                        )}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </p>
                      {slot.reason && (
                        <p className="text-xs text-[#6b6b6b] italic mt-0.5">
                          {slot.reason}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteSlot(slot.id)}
                      disabled={deletingSlotId === slot.id}
                      className="p-2 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title={t('teacherAvailability.removeSlotTitle')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label={t('teacherAvailability.summary.totalTeachers')} value={totalTeachers} color="text-[#284342]" />
        <SummaryCard
          label={t('teacherAvailability.summary.unavailableWindows')}
          value={totalBlockedWindows}
          color="text-red-700"
        />
        {isTeacherView && (
          <SummaryCard
            label={t('teacherAvailability.summary.myUpcoming')}
            value={upcomingMyBlocks}
            color="text-amber-700"
          />
        )}
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            {t('teacherAvailability.loadingAvailability')}
          </div>
        )}

        {!loading && teachers.length === 0 && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            {t('teacherAvailability.noneUnavailable')}
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
                      className="p-4 rounded-lg border border-red-200 bg-red-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-[#284342]" />
                          <span className="text-sm text-[#284342]">
                            {t(`teacherAvailability.weekday.${slot.dayKey}`)}
                          </span>
                        </div>

                        <XCircle size={16} className="text-red-700" />
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-[#6b6b6b]" />
                        <span className="text-sm text-[#6b6b6b]">
                          {slot.time}
                        </span>
                      </div>

                      <span className="text-xs px-3 py-1 rounded-full inline-block bg-red-100 text-red-700">
                        {slot.reason || t('teacherAvailability.status.unavailable')}
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

function getTeacherName(teacher: any, t: (key: string) => string) {
  if (!teacher) return t('teacherAvailability.unnamedTeacher');

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;
  const user = Array.isArray(actualTeacher?.users)
    ? actualTeacher.users[0]
    : actualTeacher?.users;

  return (
    user?.full_name ||
    actualTeacher?.specialization ||
    t('teacherAvailability.unnamedTeacher')
  );
}
