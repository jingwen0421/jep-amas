import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Send, Users, Mail, MessageSquare, Bell, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  fetchRecipientGroup,
  Recipient,
  sendEmail,
  queueWhatsAppMessage,
} from '../../services/communicationService';
import { createNotification } from '../../services/notificationService';
import { useLanguage } from '../../context/LanguageContext';

const NO_ACCOUNT_ERROR = '__no_account_on_file__';
const NO_NOTIFICATION_ERROR = '__failed_to_create_notification__';
const NO_EMAIL_ERROR = '__no_email_on_file__';
const NO_PHONE_ERROR = '__no_phone_on_file__';

type RecipientGroup = 'all_students' | 'all_teachers' | 'course' | 'batch';
type Channel = 'in_app' | 'email' | 'whatsapp';

interface CourseOption {
  id: string;
  course_name: string;
}

interface BatchOption {
  id: string;
  batch_name: string;
}

interface SendResult {
  recipient: string;
  channel: Channel;
  success: boolean;
  error?: string;
}

export default function BroadcastMessages() {
  const { t } = useLanguage();
  const [group, setGroup] = useState<RecipientGroup>('all_students');
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [refId, setRefId] = useState('');

  const [channels, setChannels] = useState<Set<Channel>>(new Set(['in_app']));
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [previewRecipients, setPreviewRecipients] = useState<Recipient[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, course_name')
      .order('course_name', { ascending: true })
      .then(({ data }) => setCourses(data || []));

    supabase
      .from('class_batches')
      .select('id, batch_name')
      .order('batch_name', { ascending: true })
      .then(({ data }) => setBatches(data || []));
  }, []);

  useEffect(() => {
    setPreviewRecipients(null);
    setRefId('');
  }, [group]);

  function toggleChannel(channel: Channel) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

  async function loadPreview() {
    if ((group === 'course' || group === 'batch') && !refId) {
      setPreviewRecipients([]);
      return;
    }

    setLoadingPreview(true);
    const recipients = await fetchRecipientGroup(group, refId || undefined);
    setPreviewRecipients(recipients);
    setLoadingPreview(false);
  }

  async function handleSend() {
    setFormError(null);
    setResults(null);

    if (channels.size === 0) {
      setFormError(t('broadcast.error.pickChannel'));
      return;
    }

    if (channels.has('email') && !subject.trim()) {
      setFormError(t('broadcast.error.emailSubjectRequired'));
      return;
    }

    if (!message.trim()) {
      setFormError(t('broadcast.error.messageRequired'));
      return;
    }

    if ((group === 'course' || group === 'batch') && !refId) {
      setFormError(t('broadcast.error.chooseCourseOrBatch'));
      return;
    }

    setSending(true);
    const recipients = await fetchRecipientGroup(group, refId || undefined);

    if (recipients.length === 0) {
      setSending(false);
      setFormError(t('broadcast.error.noRecipients'));
      return;
    }

    const jobs: { recipient: Recipient; channel: Channel }[] = [];
    recipients.forEach((r) => {
      channels.forEach((c) => jobs.push({ recipient: r, channel: c }));
    });

    setProgress({ done: 0, total: jobs.length });
    const outcomes: SendResult[] = [];

    // Sequential, not Promise.all — sending dozens of emails through one
    // Gmail account concurrently risks tripping Gmail's own rate limiting.
    for (const job of jobs) {
      const { recipient, channel } = job;
      let outcome: SendResult;

      if (channel === 'in_app') {
        if (!recipient.userId) {
          outcome = { recipient: recipient.name, channel, success: false, error: NO_ACCOUNT_ERROR };
        } else {
          const note = await createNotification({
            userId: recipient.userId,
            title: subject.trim() || t('broadcast.defaultAnnouncementTitle'),
            message: message.trim(),
            channel: 'in_app',
            deliveryStatus: 'sent',
            sentAt: new Date().toISOString(),
            type: 'broadcast',
            priority: 'normal',
            relatedModule: 'Communications',
          });
          outcome = { recipient: recipient.name, channel, success: !!note, error: note ? undefined : NO_NOTIFICATION_ERROR };
        }
      } else if (channel === 'email') {
        if (!recipient.email) {
          outcome = { recipient: recipient.name, channel, success: false, error: NO_EMAIL_ERROR };
        } else {
          const result = await sendEmail({
            to: recipient.email,
            toName: recipient.name,
            subject: subject.trim(),
            body: message.trim(),
            userId: recipient.userId,
            relatedModule: 'Communications',
          });
          outcome = { recipient: recipient.name, channel, success: result.success, error: result.error };
        }
      } else {
        if (!recipient.phone) {
          outcome = { recipient: recipient.name, channel, success: false, error: NO_PHONE_ERROR };
        } else {
          const result = await queueWhatsAppMessage({
            to: recipient.phone,
            toName: recipient.name,
            message: message.trim(),
            userId: recipient.userId,
            relatedModule: 'Communications',
          });
          outcome = { recipient: recipient.name, channel, success: result.success, error: result.error };
        }
      }

      outcomes.push(outcome);
      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    setResults(outcomes);
    setSending(false);
  }

  const successCount = results?.filter((r) => r.success).length || 0;
  const failCount = results ? results.length - successCount : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('broadcast.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {t('broadcast.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] space-y-5">
        <div>
          <label className="block text-sm text-[#284342] mb-2">{t('broadcast.recipients')}</label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as RecipientGroup)}
            className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            <option value="all_students">{t('broadcast.group.allStudents')}</option>
            <option value="all_teachers">{t('broadcast.group.allTeachers')}</option>
            <option value="course">{t('broadcast.group.studentsInCourse')}</option>
            <option value="batch">{t('broadcast.group.studentsInBatch')}</option>
          </select>

          {group === 'course' && (
            <select
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              <option value="">{t('broadcast.selectCourse')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name}
                </option>
              ))}
            </select>
          )}

          {group === 'batch' && (
            <select
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              <option value="">{t('broadcast.selectBatch')}</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadPreview}
            disabled={loadingPreview}
            className="mt-3 text-sm text-[#284342] hover:underline disabled:opacity-50 flex items-center gap-1.5"
          >
            <Users size={14} />
            {loadingPreview ? t('broadcast.counting') : t('broadcast.previewCount')}
          </button>

          {previewRecipients !== null && (
            <p className="text-sm text-[#6b6b6b] mt-1">
              {t('broadcast.matchCount', { count: previewRecipients.length })}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-[#284342] mb-2">{t('broadcast.channels')}</label>
          <div className="flex gap-3 flex-wrap">
            <ChannelToggle
              icon={<Bell size={16} />}
              label={t('broadcast.channel.inApp')}
              active={channels.has('in_app')}
              onClick={() => toggleChannel('in_app')}
            />
            <ChannelToggle
              icon={<Mail size={16} />}
              label={t('broadcast.channel.email')}
              active={channels.has('email')}
              onClick={() => toggleChannel('email')}
            />
            <ChannelToggle
              icon={<MessageSquare size={16} />}
              label={t('broadcast.channel.whatsappQueued')}
              active={channels.has('whatsapp')}
              onClick={() => toggleChannel('whatsapp')}
            />
          </div>
        </div>

        {channels.has('email') && (
          <div>
            <label className="block text-sm text-[#284342] mb-2">{t('broadcast.subjectLabel')}</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('broadcast.subjectPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-[#284342] mb-2">{t('emailComms.message')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder={t('broadcast.messagePlaceholder')}
            className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          />
        </div>

        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}

        {sending && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b6b6b]">{t('broadcast.sending')}</span>
              <span className="text-xs text-[#284342]">
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-[#e8e7e2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#284342] rounded-full transition-all"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Send size={20} />
          {sending ? t('broadcast.sending') : t('broadcast.sendBroadcast')}
        </button>
      </div>

      {results && (
        <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
          <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
            <h2 className="text-lg text-[#284342]">{t('broadcast.result')}</h2>
            <p className="text-sm text-[#6b6b6b]">
              {t('broadcast.resultSummary', { sent: successCount, failed: failCount })}
            </p>
          </div>

          <div className="divide-y divide-[rgba(40,67,66,0.1)] max-h-96 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {r.success ? (
                    <CheckCircle2 size={16} className="text-green-700 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-600 shrink-0" />
                  )}
                  <span className="text-sm text-[#284342]">{r.recipient}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#f8f8f6] text-[#6b6b6b] capitalize">
                    {r.channel === 'in_app' ? t('broadcast.channel.inApp') : r.channel}
                  </span>
                </div>
                {r.error && <span className="text-xs text-red-600">{translateBroadcastError(r.error, t)}</span>}
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#f8f8f6] border-t border-[rgba(40,67,66,0.1)] text-xs text-[#6b6b6b]">
            {t('broadcast.fullHistoryPrefix')}{' '}
            <Link to="/app/communications/email" className="text-[#284342] hover:underline">
              {t('emailComms.title')}
            </Link>
            ,{' '}
            <Link to="/app/communications/whatsapp" className="text-[#284342] hover:underline">
              {t('whatsappComms.title')}
            </Link>
            , {t('broadcast.and')}{' '}
            <Link to="/app/notifications" className="text-[#284342] hover:underline">
              {t('notifications.title')}
            </Link>
            .
          </div>
        </div>
      )}
    </div>
  );
}

function translateBroadcastError(error: string, t: (key: string) => string) {
  if (error === NO_ACCOUNT_ERROR) return t('broadcast.error.noAccountOnFile');
  if (error === NO_NOTIFICATION_ERROR) return t('broadcast.error.notificationFailed');
  if (error === NO_EMAIL_ERROR) return t('broadcast.error.noEmailOnFile');
  if (error === NO_PHONE_ERROR) return t('broadcast.error.noPhoneOnFile');
  return error;
}

function ChannelToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
        active
          ? 'bg-[#284342] text-[#e9da95] border-[#284342]'
          : 'bg-white text-[#284342] border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6]'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
