import { useEffect, useState } from 'react';
import { CalendarClock, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/session';
import { useLanguage } from '../context/LanguageContext';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface RescheduleRow {
  id: string;
  reason: string | null;
  preferred_period: string | null;
  status: ReviewStatus;
  created_at: string;
  reviewed_at: string | null;
  calendar_event_id: string;
  source_table: string;
  source_id: string;
  event_title: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  studentName: string;
}

const TABS: { key: 'pending' | 'approved' | 'rejected' | 'all'; labelKey: string }[] = [
  { key: 'pending', labelKey: 'unifiedCalendar.status.pending' },
  { key: 'approved', labelKey: 'unifiedCalendar.status.approved' },
  { key: 'rejected', labelKey: 'unifiedCalendar.status.rejected' },
  { key: 'all', labelKey: 'rescheduleRequests.tab.all' },
];

const SOURCE_DATETIME_COLUMN: Record<string, string> = {
  lessons: 'lesson_datetime',
  appointments: 'appointment_datetime',
  makeup_classes: 'makeup_datetime',
};

export default function RescheduleRequests() {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const canReview = [
    'super_admin',
    'admin',
    'owner',
    'teacher',
    'assistant_teacher',
  ].includes(currentUser.role);
  const isStudentView = currentUser.role === 'student';

  const [rows, setRows] = useState<RescheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>(
    'pending'
  );

  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [rescheduleDate, setRescheduleDate] = useState<Record<string, string>>({});
  const [rescheduleTime, setRescheduleTime] = useState<Record<string, string>>({});
  const [expandedApproveId, setExpandedApproveId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from('reschedule_requests')
      .select(
        `
        id,
        reason,
        preferred_period,
        status,
        created_at,
        reviewed_at,
        calendar_event_id,
        calendar_events(title, event_type, starts_at, ends_at, source_table, source_id),
        students(full_name)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch reschedule requests:', error.message);
      setLoading(false);
      return;
    }

    const mapped: RescheduleRow[] = (data || []).map((row: any) => {
      const event = Array.isArray(row.calendar_events)
        ? row.calendar_events[0]
        : row.calendar_events;
      const student = Array.isArray(row.students) ? row.students[0] : row.students;

      return {
        id: row.id,
        reason: row.reason,
        preferred_period: row.preferred_period,
        status: row.status,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at,
        calendar_event_id: row.calendar_event_id,
        source_table: event?.source_table || '',
        source_id: event?.source_id || '',
        event_title: event?.title || '',
        event_type: event?.event_type || '-',
        starts_at: event?.starts_at || '',
        ends_at: event?.ends_at || '',
        studentName: student?.full_name || '',
      };
    });

    setRows(mapped);
    setLoading(false);
  }

  function toggleApproveForm(id: string) {
    setExpandedApproveId((prev) => (prev === id ? null : id));
    setRowError((prev) => ({ ...prev, [id]: '' }));
  }

  async function approveRequest(row: RescheduleRow) {
    setActioningId(row.id);
    setRowError((prev) => ({ ...prev, [row.id]: '' }));

    const date = rescheduleDate[row.id];
    const time = rescheduleTime[row.id];

    if ((date && !time) || (!date && time)) {
      setRowError((prev) => ({
        ...prev,
        [row.id]: t('rescheduleRequests.error.provideBothOrNeither'),
      }));
      setActioningId(null);
      return;
    }

    if (date && time) {
      const column = SOURCE_DATETIME_COLUMN[row.source_table];

      if (!column) {
        setRowError((prev) => ({
          ...prev,
          [row.id]: t('rescheduleRequests.error.unsupportedSourceType', {
            sourceType: row.source_table,
          }),
        }));
        setActioningId(null);
        return;
      }

      const newDateTime = `${date}T${time}:00+08:00`;

      const { data: updatedRows, error: updateError } = await supabase
        .from(row.source_table)
        .update({ [column]: newDateTime })
        .eq('id', row.source_id)
        .select('id');

      if (updateError) {
        setRowError((prev) => ({ ...prev, [row.id]: updateError.message }));
        setActioningId(null);
        return;
      }

      if (!updatedRows || updatedRows.length === 0) {
        setRowError((prev) => ({
          ...prev,
          [row.id]: t('rescheduleRequests.error.noPermissionToReschedule'),
        }));
        setActioningId(null);
        return;
      }
    }

    const { error } = await supabase
      .from('reschedule_requests')
      .update({
        status: 'approved',
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    setActioningId(null);

    if (error) {
      setRowError((prev) => ({ ...prev, [row.id]: error.message }));
      return;
    }

    setExpandedApproveId(null);
    fetchRequests();
  }

  async function rejectRequest(row: RescheduleRow) {
    setActioningId(row.id);
    setRowError((prev) => ({ ...prev, [row.id]: '' }));

    const { error } = await supabase
      .from('reschedule_requests')
      .update({
        status: 'rejected',
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    setActioningId(null);

    if (error) {
      setRowError((prev) => ({ ...prev, [row.id]: error.message }));
      return;
    }

    fetchRequests();
  }

  const filteredRows =
    activeTab === 'all' ? rows : rows.filter((row) => row.status === activeTab);

  const pendingCount = rows.filter((row) => row.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('rescheduleRequests.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {isStudentView
            ? t('rescheduleRequests.subtitle.student')
            : t('rescheduleRequests.subtitle.reviewer')}
        </p>
      </div>

      {!isStudentView && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            label={t('rescheduleRequests.summary.pendingReview')}
            value={pendingCount}
            color="text-amber-700"
          />
          <SummaryCard
            label={t('rescheduleRequests.summary.approved')}
            value={rows.filter((row) => row.status === 'approved').length}
            color="text-green-700"
          />
          <SummaryCard
            label={t('rescheduleRequests.summary.totalRequests')}
            value={rows.length}
            color="text-[#284342]"
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] p-4 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-[#284342] text-[#e9da95]'
                : 'text-[#284342] border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6]'
            }`}
          >
            {t(tab.labelKey)}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-2 text-xs">({pendingCount})</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('rescheduleRequests.loading')}
            </div>
          )}

          {!loading && filteredRows.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {activeTab === 'all'
                ? t('rescheduleRequests.empty.all')
                : t('rescheduleRequests.empty.filtered', {
                    status: t(
                      activeTab === 'pending'
                        ? 'unifiedCalendar.status.pending'
                        : activeTab === 'approved'
                        ? 'unifiedCalendar.status.approved'
                        : 'unifiedCalendar.status.rejected'
                    ),
                  })}
            </div>
          )}

          {!loading &&
            filteredRows.map((row) => (
              <div key={row.id} className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-[#284342]">
                        {row.event_title || t('rescheduleRequests.fallback.scheduledItem')}
                      </h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full capitalize ${
                          row.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : row.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {t(`unifiedCalendar.status.${row.status}`)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b6b6b] mb-2">
                      {!isStudentView && (
                        <span className="flex items-center gap-1.5">
                          <User size={14} />
                          {row.studentName || t('rescheduleRequests.fallback.student')}
                        </span>
                      )}

                      {row.starts_at && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatDateTime(row.starts_at)}
                        </span>
                      )}
                    </div>

                    {row.reason && (
                      <p className="text-sm text-[#284342] mb-1">
                        <strong>{t('rescheduleRequests.field.reason')}:</strong> {row.reason}
                      </p>
                    )}

                    {row.preferred_period && (
                      <p className="text-sm text-[#6b6b6b]">
                        <strong>{t('rescheduleRequests.field.preferred')}:</strong>{' '}
                        {row.preferred_period}
                      </p>
                    )}

                    {row.reviewed_at && (
                      <p className="text-xs text-[#6b6b6b] mt-2">
                        {t('rescheduleRequests.reviewedAt', {
                          date: formatDateTime(row.reviewed_at),
                        })}
                      </p>
                    )}
                  </div>

                  {canReview && row.status === 'pending' && (
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleApproveForm(row.id)}
                        disabled={actioningId === row.id}
                        className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm disabled:opacity-50"
                      >
                        {t('rescheduleRequests.action.approve')}
                      </button>

                      <button
                        onClick={() => rejectRequest(row)}
                        disabled={actioningId === row.id}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm disabled:opacity-50"
                      >
                        {actioningId === row.id
                          ? t('rescheduleRequests.action.working')
                          : t('rescheduleRequests.action.reject')}
                      </button>
                    </div>
                  )}
                </div>

                {canReview && expandedApproveId === row.id && (
                  <div className="mt-4 p-4 bg-[#f8f8f6] rounded-lg border border-[rgba(40,67,66,0.1)]">
                    <p className="text-sm text-[#284342] mb-3">
                      {t('rescheduleRequests.approveForm.description')}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#6b6b6b] mb-1">
                          {t('rescheduleRequests.field.newDate')}
                        </label>
                        <input
                          type="date"
                          value={rescheduleDate[row.id] || ''}
                          onChange={(e) =>
                            setRescheduleDate((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#6b6b6b] mb-1">
                          {t('rescheduleRequests.field.newTime')}
                        </label>
                        <input
                          type="time"
                          value={rescheduleTime[row.id] || ''}
                          onChange={(e) =>
                            setRescheduleTime((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                        />
                      </div>
                    </div>

                    {rowError[row.id] && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{rowError[row.id]}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => approveRequest(row)}
                        disabled={actioningId === row.id}
                        className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm disabled:opacity-50"
                      >
                        {actioningId === row.id
                          ? t('rescheduleRequests.action.confirming')
                          : t('rescheduleRequests.action.confirmApproval')}
                      </button>

                      <button
                        onClick={() => setExpandedApproveId(null)}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-white transition-colors text-sm"
                      >
                        {t('rescheduleRequests.action.cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {rowError[row.id] && expandedApproveId !== row.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{rowError[row.id]}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
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
      <div className="flex items-center gap-2 mb-2">
        <CalendarClock size={16} className="text-[#6b6b6b]" />
        <p className="text-sm text-[#6b6b6b]">{label}</p>
      </div>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
