import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../services/unifiedNotificationService';
import { useLanguage } from '../../context/LanguageContext';

interface MakeupClass {
  id: string;
  student: string;
  studentUserId: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  originalClass: string;
  missedDate: string;
  reason: string;
  makeupDate: string;
  makeupTime: string;
  teacher: string;
  status: 'Scheduled' | 'Completed' | 'Pending';
  isExternal: boolean;
  externalProvider: string;
}

interface TeacherOption {
  id: string;
  specialization: string | null;
  users?: { full_name: string }[] | { full_name: string } | null;
}

export default function MakeupClasses() {
  const { t } = useLanguage();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [makeupClasses, setMakeupClasses] = useState<MakeupClass[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedMakeupId, setSelectedMakeupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingNotificationId, setSendingNotificationId] = useState('');

  const [formData, setFormData] = useState({
    makeupDate: '',
    makeupTime: '',
    teacherId: '',
    isExternal: false,
    externalProvider: '',
  });

  useEffect(() => {
    fetchMakeupClasses();
    fetchTeachers();
  }, []);

  async function fetchMakeupClasses() {
    setLoading(true);

    const { data, error } = await supabase
      .from('makeup_classes')
      .select(`
        id,
        makeup_datetime,
        status,
        reason,
        is_external,
        external_provider,
        students(full_name, user_id, email, phone),
        lessons(lesson_title, lesson_datetime),
        teachers(
          specialization,
          users(full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching makeup classes:', error.message);
      setLoading(false);
      return;
    }

    const mapped: MakeupClass[] = (data || []).map((item: any) => {
      const makeupDateTime = item.makeup_datetime
        ? new Date(item.makeup_datetime)
        : null;

      const missedDate = item.lessons?.lesson_datetime
        ? new Date(item.lessons.lesson_datetime).toISOString().slice(0, 10)
        : '-';

      return {
        id: item.id,
        student: item.students?.full_name || t('makeupClasses.unnamedStudent'),
        studentUserId: item.students?.user_id || null,
        studentEmail: item.students?.email || null,
        studentPhone: item.students?.phone || null,
        originalClass: item.lessons?.lesson_title || '-',
        missedDate,
        reason: item.reason || t('makeupClasses.fallback.absent'),
        makeupDate: makeupDateTime
          ? makeupDateTime.toISOString().slice(0, 10)
          : '',
        makeupTime: makeupDateTime
          ? makeupDateTime.toTimeString().slice(0, 5)
          : '',
        teacher: getTeacherNameFromJoin(item.teachers),
        status:
          item.status === 'completed'
            ? 'Completed'
            : item.status === 'scheduled'
            ? 'Scheduled'
            : 'Pending',
        isExternal: !!item.is_external,
        externalProvider: item.external_provider || '',
      };
    });

    setMakeupClasses(mapped);
    setLoading(false);
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

  function openScheduleModal(makeupId: string) {
    const existing = makeupClasses.find((m) => m.id === makeupId);
    setFormData({
      makeupDate: existing?.makeupDate || '',
      makeupTime: existing?.makeupTime || '',
      teacherId: '',
      isExternal: existing?.isExternal || false,
      externalProvider: existing?.externalProvider || '',
    });
    setSelectedMakeupId(makeupId);
    setShowScheduleModal(true);
  }

  async function scheduleMakeupClass() {
    if (!selectedMakeupId || !formData.makeupDate || !formData.makeupTime) {
      alert(t('makeupClasses.alert.selectDateTime'));
      return;
    }

    if (formData.isExternal && !formData.externalProvider.trim()) {
      alert(t('makeupClasses.alert.enterExternalProvider'));
      return;
    }

    const makeupDateTime = `${formData.makeupDate}T${formData.makeupTime}:00+08:00`;

    const { error } = await supabase
      .from('makeup_classes')
      .update({
        makeup_datetime: makeupDateTime,
        teacher_id: formData.teacherId || null,
        status: 'scheduled',
        is_external: formData.isExternal,
        external_provider: formData.isExternal ? formData.externalProvider.trim() : null,
      })
      .eq('id', selectedMakeupId);

    if (error) {
      alert(t('makeupClasses.alert.scheduleFailed', { message: error.message }));
      return;
    }

    setFormData({
      makeupDate: '',
      makeupTime: '',
      teacherId: '',
      isExternal: false,
      externalProvider: '',
    });

    setSelectedMakeupId('');
    setShowScheduleModal(false);
    fetchMakeupClasses();
  }

  async function sendNotification(makeup: MakeupClass) {
    if (!makeup.studentUserId && !makeup.studentEmail) {
      alert(t('makeupClasses.alert.noContact'));
      return;
    }

    setSendingNotificationId(makeup.id);

    const message = makeup.makeupDate
      ? t('makeupClasses.notifyMessage.scheduled', {
          className: makeup.originalClass,
          date: makeup.makeupDate,
          time: makeup.makeupTime,
          providerSuffix: makeup.isExternal ? ` (${makeup.externalProvider})` : '',
        })
      : t('makeupClasses.notifyMessage.pending', { className: makeup.originalClass });

    await notify({
      target: {
        userId: makeup.studentUserId,
        name: makeup.student,
        email: makeup.studentEmail,
        phone: makeup.studentPhone,
      },
      channels: ['in_app', 'email'],
      title: t('makeupClasses.notifyTitle'),
      message,
      type: 'makeup_class',
      relatedModule: 'Makeup Classes',
      relatedId: makeup.id,
    });

    setSendingNotificationId('');
    alert(t('makeupClasses.alert.notificationSent', { name: makeup.student }));
  }

  async function markComplete(makeupId: string) {
    const { error } = await supabase
      .from('makeup_classes')
      .update({ status: 'completed' })
      .eq('id', makeupId);

    if (error) {
      alert(t('makeupClasses.alert.completeFailed', { message: error.message }));
      return;
    }

    fetchMakeupClasses();
  }

  const scheduledCount = makeupClasses.filter(
    (item) => item.status === 'Scheduled'
  ).length;

  const pendingCount = makeupClasses.filter(
    (item) => item.status === 'Pending'
  ).length;

  const completedCount = makeupClasses.filter(
    (item) => item.status === 'Completed'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('makeupClasses.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('makeupClasses.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          {t('makeupClasses.scheduleMakeupClass')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          icon={<Clock size={24} className="text-blue-700" />}
          label={t('makeupClasses.status.scheduled')}
          value={scheduledCount}
          color="text-blue-700"
        />

        <SummaryCard
          icon={<Calendar size={24} className="text-yellow-700" />}
          label={t('makeupClasses.status.pending')}
          value={pendingCount}
          color="text-yellow-700"
        />

        <SummaryCard
          icon={<CheckCircle2 size={24} className="text-green-700" />}
          label={t('makeupClasses.status.completed')}
          value={completedCount}
          color="text-green-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('makeupClasses.scheduleHeading')}</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('makeupClasses.loading')}
            </div>
          )}

          {!loading && makeupClasses.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('makeupClasses.empty')}
            </div>
          )}

          {!loading &&
            makeupClasses.map((makeup) => (
              <div
                key={makeup.id}
                className="p-6 hover:bg-[#f8f8f6] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-[#284342]">
                        {makeup.student}
                      </h3>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          makeup.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : makeup.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {makeup.status === 'Completed'
                          ? t('makeupClasses.status.completed')
                          : makeup.status === 'Scheduled'
                          ? t('makeupClasses.status.scheduled')
                          : t('makeupClasses.status.pending')}
                      </span>
                      {makeup.isExternal && (
                        <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                          {t('makeupClasses.externalService')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <Info label={t('makeupClasses.field.originalClass')} value={makeup.originalClass} />
                      <Info label={t('makeupClasses.field.missedDate')} value={makeup.missedDate} />
                      <Info label={t('makeupClasses.field.reason')} value={makeup.reason} />
                      <Info
                        label={t('makeupClasses.field.status')}
                        value={
                          makeup.status === 'Completed'
                            ? t('makeupClasses.status.completed')
                            : makeup.status === 'Scheduled'
                            ? t('makeupClasses.status.scheduled')
                            : t('makeupClasses.status.pending')
                        }
                      />
                    </div>

                    {makeup.status !== 'Pending' && (
                      <div className="mt-3 p-4 rounded-lg bg-[#e9da95]/10 border border-[#e9da95]/30">
                        <p className="text-sm text-[#284342] mb-2">
                          {t('makeupClasses.sessionDetails')}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <Info label={t('makeupClasses.field.date')} value={makeup.makeupDate} />
                          <Info label={t('makeupClasses.field.time')} value={makeup.makeupTime} />
                          {makeup.isExternal ? (
                            <Info label={t('makeupClasses.field.externalProvider')} value={makeup.externalProvider} />
                          ) : (
                            <Info label={t('makeupClasses.field.teacher')} value={makeup.teacher} />
                          )}
                          <Info label={t('makeupClasses.field.room')} value={makeup.isExternal ? t('makeupClasses.offsite') : '-'} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  {makeup.status === 'Pending' && (
                    <button
                      onClick={() => openScheduleModal(makeup.id)}
                      className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                    >
                      {t('makeupClasses.scheduleMakeup')}
                    </button>
                  )}

                  {makeup.status === 'Scheduled' && (
                    <>
                      <button
                        onClick={() => markComplete(makeup.id)}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                      >
                        {t('makeupClasses.markComplete')}
                      </button>

                      <button
                        onClick={() => openScheduleModal(makeup.id)}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                      >
                        {t('makeupClasses.reschedule')}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => sendNotification(makeup)}
                    disabled={sendingNotificationId === makeup.id}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm disabled:opacity-50"
                  >
                    {sendingNotificationId === makeup.id
                      ? t('makeupClasses.sending')
                      : t('makeupClasses.sendNotification')}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-lg text-[#284342] mb-4">
          {t('makeupClasses.howItWorks')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Step number="1" title={t('makeupClasses.step1.title')} desc={t('makeupClasses.step1.desc')} color="red" />
          <Step number="2" title={t('makeupClasses.step2.title')} desc={t('makeupClasses.step2.desc')} color="yellow" />
          <Step number="3" title={t('makeupClasses.step3.title')} desc={t('makeupClasses.step3.desc')} color="blue" />
          <Step number="4" title={t('makeupClasses.step4.title')} desc={t('makeupClasses.step4.desc')} color="green" />
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              {t('makeupClasses.scheduleMakeupClass')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('makeupClasses.field.makeupDate')}
                </label>

                <input
                  type="date"
                  value={formData.makeupDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      makeupDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('makeupClasses.field.time')}
                </label>

                <input
                  type="time"
                  value={formData.makeupTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      makeupTime: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={formData.isExternal}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isExternal: e.target.checked,
                        teacherId: e.target.checked ? '' : prev.teacherId,
                      }))
                    }
                    className="w-4 h-4 accent-[#284342]"
                  />
                  <span className="text-sm text-[#284342]">
                    {t('makeupClasses.externalServiceCheckbox')}
                  </span>
                </label>

                {formData.isExternal ? (
                  <div>
                    <label className="block text-sm text-[#284342] mb-2">
                      {t('makeupClasses.field.externalProviderLocation')}
                    </label>
                    <input
                      value={formData.externalProvider}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          externalProvider: e.target.value,
                        }))
                      }
                      placeholder={t('makeupClasses.externalProviderPlaceholder')}
                      className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-[#284342] mb-2">
                      {t('makeupClasses.field.teacher')}
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
                      <option value="">{t('makeupClasses.selectTeacher')}</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {getTeacherName(teacher)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('makeupClasses.cancel')}
              </button>

              <button
                onClick={scheduleMakeupClass}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {t('makeupClasses.scheduleMakeup')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-[#284342]">{value || '-'}</p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div>
          <p className="text-sm text-[#6b6b6b]">{label}</p>
          <p className={`text-2xl ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  desc,
  color,
}: {
  number: string;
  title: string;
  desc: string;
  color: 'red' | 'yellow' | 'blue' | 'green';
}) {
  const colorMap = {
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <div className="text-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${colorMap[color]}`}
      >
        <span>{number}</span>
      </div>
      <p className="text-sm text-[#284342] mb-1">{title}</p>
      <p className="text-xs text-[#6b6b6b]">{desc}</p>
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

function getTeacherNameFromJoin(teacher: any) {
  if (!teacher) return '-';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;

  if (!actualTeacher) return '-';

  return getTeacherName(actualTeacher);
}