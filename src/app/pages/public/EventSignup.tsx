import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EventDetails {
  title: string;
  description: string;
  eventKind: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  capacity: number | null;
  confirmedCount: number;
  open: boolean;
  full: boolean;
}

export default function EventSignup() {
  const { occurrenceId } = useParams<{ occurrenceId: string }>();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [studentSession, setStudentSession] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchDetails();
    checkStudentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occurrenceId]);

  async function fetchDetails() {
    if (!occurrenceId) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('public-event-signup', {
      body: { action: 'get', occurrenceId },
    });

    if (error || data?.error) {
      setLoadError(data?.error || error?.message || 'This event could not be found.');
      setLoading(false);
      return;
    }

    setDetails(data as EventDetails);
    setLoading(false);
  }

  async function checkStudentSession() {
    setCheckingSession(true);

    const { data } = await supabase.auth.getUser();
    const authUser = data?.user;

    if (!authUser?.email) {
      setCheckingSession(false);
      return;
    }

    const { data: student } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('email', authUser.email)
      .maybeSingle();

    if (student) {
      setStudentSession({ id: student.id, name: student.full_name });
    }

    setCheckingSession(false);
  }

  async function registerAsStudent() {
    if (!occurrenceId || !studentSession) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from('event_registrations').insert({
      occurrence_id: occurrenceId,
      student_id: studentSession.id,
      status: 'confirmed',
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setDone(true);
  }

  async function submitGuestForm() {
    if (!occurrenceId) return;

    if (!form.name.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { data, error } = await supabase.functions.invoke('public-event-signup', {
      body: {
        action: 'register',
        occurrenceId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      },
    });

    setSubmitting(false);

    if (error || data?.error) {
      setSubmitError(data?.error || error?.message || 'Failed to register.');
      return;
    }

    setDone(true);
  }

  if (loading || checkingSession) {
    return (
      <PageShell>
        <p className="text-[#6b6b6b] text-center py-12">Loading event details...</p>
      </PageShell>
    );
  }

  if (loadError || !details) {
    return (
      <PageShell>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-800">{loadError || 'This event is not available.'}</p>
        </div>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell>
        <div className="p-8 text-center">
          <CheckCircle2 size={40} className="text-green-700 mx-auto mb-4" />
          <h2 className="text-xl text-[#284342] mb-2">You're registered!</h2>
          <p className="text-[#6b6b6b]">
            You're signed up for <strong>{details.title}</strong>. See you there.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl text-[#284342] mb-2">{details.title}</h1>
        {details.description && (
          <p className="text-[#6b6b6b] text-sm mb-4">{details.description}</p>
        )}

        <div className="space-y-2 text-sm text-[#6b6b6b]">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            {new Date(details.startsAt).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} />
            {new Date(details.startsAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            -{' '}
            {new Date(details.endsAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            {details.venue}
          </div>
        </div>
      </div>

      {details.full ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <p className="text-amber-800 text-sm">
            This event is full — registration is closed.
          </p>
        </div>
      ) : !details.open ? (
        <div className="p-4 bg-[#f8f8f6] border border-[rgba(40,67,66,0.1)] rounded-lg text-center">
          <p className="text-[#6b6b6b] text-sm">Registration for this event is not open.</p>
        </div>
      ) : studentSession ? (
        <div className="space-y-3">
          <p className="text-sm text-[#284342]">
            You're logged in as <strong>{studentSession.name}</strong>.
          </p>
          <button
            onClick={registerAsStudent}
            disabled={submitting}
            className="w-full px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Registering...' : `Register as ${studentSession.name}`}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[#284342] mb-2">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#284342] mb-2">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#284342] mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}

          <button
            onClick={submitGuestForm}
            disabled={submitting}
            className="w-full px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] max-w-lg w-full p-6">
        <p className="text-xs text-[#6b6b6b] mb-4">JEP Image Makeup Academy</p>
        {children}
      </div>
    </div>
  );
}
