import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  Search,
  Trash2,
  UserPlus,
  ClipboardCheck,
  Link2,
  Copy,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';

const EVENT_KIND_OPTIONS = [
  { value: 'trial_class', label: 'Trial Class' },
  { value: 'consultation', label: '1-on-1 Consultation' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'open_house', label: 'Open House' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'other', label: 'Other' },
];

function eventKindLabel(kind: string) {
  return EVENT_KIND_OPTIONS.find((k) => k.value === kind)?.label || kind;
}

interface StaffTag {
  id: string;
  name: string;
  role: string;
}

interface RegistrantRow {
  id: string;
  name: string;
  status: string;
  isGuest: boolean;
}

interface EventOccurrence {
  id: string;
  eventId: string;
  title: string;
  description: string;
  eventKind: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string | null;
  venueName: string;
  isOtherVenue: boolean;
  capacity: number | null;
  price: number;
  status: string;
  registrationOpen: boolean;
  registrationDeadline: string | null;
  publicRegistrationEnabled: boolean;
  externalRegistrationUrl: string;
  staff: StaffTag[];
  registrants: RegistrantRow[];
}

const OTHER_VENUE = '__other__';

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

interface VenueOption {
  id: string;
  room_name: string;
}

interface StudentOption {
  id: string;
  full_name: string;
  email: string;
}

const emptyForm = {
  title: '',
  description: '',
  eventKind: 'trial_class',
  date: '',
  startTime: '',
  endTime: '',
  venueId: '',
  venueOther: '',
  capacity: '',
  price: '',
  registrationOpen: false,
  registrationDeadline: '',
  publicRegistrationEnabled: false,
  externalRegistrationUrl: '',
};

export default function EventManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = getCurrentUser();

  const isStudentView = currentUser.role === 'student';
  const isTeacherView =
    currentUser.role === 'teacher' || currentUser.role === 'assistant_teacher';
  const isLeadership =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'owner';
  const canManage =
    currentUser.role === 'super_admin' || currentUser.role === 'admin';

  const [events, setEvents] = useState<EventOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentEventIds, setStudentEventIds] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<'mine' | 'all'>(isLeadership ? 'all' : 'mine');

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingOccurrenceId, setEditingOccurrenceId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [registrants, setRegistrants] = useState<RegistrantRow[]>([]);
  const [viewingRegistrantsOcc, setViewingRegistrantsOcc] = useState<EventOccurrence | null>(
    null
  );
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentOption[]>([]);
  const [guestForm, setGuestForm] = useState({ name: '', phone: '', email: '' });
  const [addingRegistrant, setAddingRegistrant] = useState(false);

  useEffect(() => {
    fetchEvents();
    if (canManage) {
      fetchStaffOptions();
      fetchVenues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam || !canManage) return;

    openCreateModal(dateParam);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('date');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canManage]);

  async function fetchEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from('event_occurrences')
      .select(
        `
        id,
        event_id,
        starts_at,
        ends_at,
        venue_id,
        venue_name,
        capacity,
        price,
        status,
        registration_open,
        registration_deadline,
        public_registration_enabled,
        external_registration_url,
        events(title, description, event_kind),
        classrooms(room_name),
        event_staff(id, user_id, role, users(full_name)),
        event_registrations(id, status, student_id, guest_name, students(full_name))
      `
      )
      .order('starts_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch events:', error.message);
      setLoading(false);
      return;
    }

    const mapped: EventOccurrence[] = (data || []).map((occ: any) => {
      const ev = getSingle(occ.events);
      const start = occ.starts_at ? new Date(occ.starts_at) : null;
      const end = occ.ends_at ? new Date(occ.ends_at) : null;

      return {
        id: occ.id,
        eventId: occ.event_id,
        title: ev?.title || 'Academy Event',
        description: ev?.description || '',
        eventKind: ev?.event_kind || 'other',
        date: start ? start.toISOString().slice(0, 10) : '',
        startTime: start ? start.toTimeString().slice(0, 5) : '-',
        endTime: end ? end.toTimeString().slice(0, 5) : '-',
        venueId: occ.venue_id || null,
        venueName:
          occ.venue_name || getSingle(occ.classrooms)?.room_name || 'No venue set',
        isOtherVenue: !!occ.venue_name && !occ.venue_id,
        capacity: occ.capacity,
        price: Number(occ.price || 0),
        status: occ.status || 'scheduled',
        registrationOpen: !!occ.registration_open,
        registrationDeadline: occ.registration_deadline || null,
        publicRegistrationEnabled: !!occ.public_registration_enabled,
        externalRegistrationUrl: occ.external_registration_url || '',
        staff: (occ.event_staff || []).map((s: any) => ({
          id: s.user_id,
          name: getSingle(s.users)?.full_name || 'Staff',
          role: s.role || '',
        })),
        registrants: (occ.event_registrations || [])
          .filter((r: any) => r.status !== 'cancelled')
          .map((r: any) => ({
            id: r.id,
            name: r.student_id
              ? getSingle(r.students)?.full_name || 'Student'
              : r.guest_name || 'Guest',
            status: r.status,
            isGuest: !r.student_id,
          })),
      };
    });

    setEvents(mapped);
    setLoading(false);

    if (isStudentView) fetchMyRegistrations();
  }

  async function fetchMyRegistrations() {
    const studentId = await getCurrentStudentId();
    if (!studentId) return;

    const { data, error } = await supabase
      .from('event_registrations')
      .select('occurrence_id')
      .eq('student_id', studentId);

    if (error) return;

    setStudentEventIds(new Set((data || []).map((r: any) => r.occurrence_id)));
  }

  async function fetchStaffOptions() {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, role')
      .in('role', ['teacher', 'assistant_teacher', 'admin', 'super_admin', 'owner'])
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch staff options:', error.message);
      return;
    }

    setStaffOptions(
      (data || []).map((u: any) => ({ id: u.id, name: u.full_name, role: u.role }))
    );
  }

  async function fetchVenues() {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, room_name')
      .order('room_name', { ascending: true });

    if (error) return;
    setVenues(data || []);
  }

  const visibleEvents = useMemo(() => {
    if (isStudentView) {
      // Students see events they're already registered for, plus any
      // event currently open for self sign-up so they can discover and
      // join it — not just the ones staff already added them to.
      return events.filter(
        (e) => studentEventIds.has(e.id) || isRegistrationOpenNow(e)
      );
    }

    if (scope === 'mine' && !isLeadership) {
      return events.filter((e) => e.staff.some((s) => s.id === currentUser.id));
    }

    return events;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, studentEventIds, scope, isStudentView, isLeadership]);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = visibleEvents.filter(
    (e) => e.date >= today && e.status !== 'cancelled'
  );
  const pastEvents = visibleEvents.filter(
    (e) => e.date < today || e.status === 'cancelled'
  );

  function openCreateModal(prefillDate?: string) {
    setEditingOccurrenceId(null);
    setEditingEventId(null);
    setForm(prefillDate ? { ...emptyForm, date: prefillDate } : emptyForm);
    setSelectedStaffIds(new Set());
    setRegistrants([]);
    setFormError(null);
    setStudentSearch('');
    setStudentResults([]);
    setGuestForm({ name: '', phone: '', email: '' });
    setShowModal(true);
  }

  function openEditModal(occ: EventOccurrence) {
    setEditingOccurrenceId(occ.id);
    setEditingEventId(occ.eventId);
    setForm({
      title: occ.title,
      description: occ.description,
      eventKind: occ.eventKind,
      date: occ.date,
      startTime: occ.startTime,
      endTime: occ.endTime,
      venueId: occ.isOtherVenue ? OTHER_VENUE : occ.venueId || '',
      venueOther: occ.isOtherVenue ? occ.venueName : '',
      capacity: occ.capacity != null ? String(occ.capacity) : '',
      price: occ.price ? String(occ.price) : '',
      registrationOpen: occ.registrationOpen,
      registrationDeadline: occ.registrationDeadline
        ? toLocalDateTimeInputValue(occ.registrationDeadline)
        : '',
      publicRegistrationEnabled: occ.publicRegistrationEnabled,
      externalRegistrationUrl: occ.externalRegistrationUrl,
    });
    setSelectedStaffIds(new Set(occ.staff.map((s) => s.id)));
    setRegistrants(occ.registrants);
    setFormError(null);
    setStudentSearch('');
    setStudentResults([]);
    setGuestForm({ name: '', phone: '', email: '' });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError(null);
  }

  function toggleStaff(id: string) {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveEvent() {
    setFormError(null);

    if (!form.title.trim()) {
      setFormError('Give the event a title.');
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      setFormError('Please select a date, start time, and end time.');
      return;
    }

    const startsAt = `${form.date}T${form.startTime}:00`;
    const endsAt = `${form.date}T${form.endTime}:00`;

    if (endsAt <= startsAt) {
      setFormError('End time must be later than start time.');
      return;
    }

    if (form.venueId === OTHER_VENUE && !form.venueOther.trim()) {
      setFormError('Enter the venue name.');
      return;
    }

    if (form.registrationOpen && form.registrationDeadline) {
      const deadlineIso = new Date(form.registrationDeadline).toISOString();
      if (deadlineIso <= new Date().toISOString() && !editingOccurrenceId) {
        setFormError('Registration deadline must be in the future.');
        return;
      }
    }

    setSaving(true);

    let eventId = editingEventId;
    let occurrenceId = editingOccurrenceId;

    if (eventId) {
      const { error } = await supabase
        .from('events')
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          event_kind: form.eventKind,
        })
        .eq('id', eventId);

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: createdEvent, error } = await supabase
        .from('events')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          event_kind: form.eventKind,
          is_active: true,
        })
        .select('id')
        .single();

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }

      eventId = createdEvent.id;
    }

    const isOtherVenue = form.venueId === OTHER_VENUE;

    const occurrencePayload = {
      event_id: eventId,
      starts_at: startsAt,
      ends_at: endsAt,
      venue_id: isOtherVenue ? null : form.venueId || null,
      venue_name: isOtherVenue ? form.venueOther.trim() : null,
      capacity: form.capacity ? Number(form.capacity) : null,
      price: form.price ? Number(form.price) : 0,
      status: 'scheduled',
      registration_open: form.registrationOpen,
      registration_deadline:
        form.registrationOpen && form.registrationDeadline
          ? new Date(form.registrationDeadline).toISOString()
          : null,
      public_registration_enabled: form.publicRegistrationEnabled,
      external_registration_url: form.externalRegistrationUrl.trim() || null,
    };

    if (occurrenceId) {
      const { error } = await supabase
        .from('event_occurrences')
        .update(occurrencePayload)
        .eq('id', occurrenceId);

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: createdOccurrence, error } = await supabase
        .from('event_occurrences')
        .insert(occurrencePayload)
        .select('id')
        .single();

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }

      occurrenceId = createdOccurrence.id;
    }

    // Sync staff involved: diff against what's currently assigned so we
    // only insert/delete the rows that actually changed — inserting a row
    // auto-locks that teacher's availability for this slot, deleting one
    // auto-frees it (see the DB triggers on event_staff).
    const { data: currentStaffRows } = await supabase
      .from('event_staff')
      .select('id, user_id')
      .eq('event_occurrence_id', occurrenceId);

    const currentStaffByUser = new Map(
      (currentStaffRows || []).map((row: any) => [row.user_id, row.id])
    );

    const toAdd = Array.from(selectedStaffIds).filter(
      (userId) => !currentStaffByUser.has(userId)
    );
    const toRemove = (currentStaffRows || []).filter(
      (row: any) => !selectedStaffIds.has(row.user_id)
    );

    if (toAdd.length > 0) {
      const { error: addError } = await supabase.from('event_staff').insert(
        toAdd.map((userId) => ({ event_occurrence_id: occurrenceId, user_id: userId }))
      );
      if (addError) {
        setFormError(`Event saved, but staff assignment failed: ${addError.message}`);
        setSaving(false);
        fetchEvents();
        return;
      }
    }

    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('event_staff')
        .delete()
        .in('id', toRemove.map((row: any) => row.id));

      if (removeError) {
        setFormError(`Event saved, but removing staff failed: ${removeError.message}`);
        setSaving(false);
        fetchEvents();
        return;
      }
    }

    setSaving(false);
    closeModal();
    fetchEvents();
  }

  async function cancelEvent(occ: EventOccurrence) {
    if (!confirm(`Cancel "${occ.title}" on ${occ.date}? This frees up any staff locked to it.`)) {
      return;
    }

    const { error } = await supabase
      .from('event_occurrences')
      .update({ status: 'cancelled' })
      .eq('id', occ.id);

    if (error) {
      alert(`Failed to cancel event: ${error.message}`);
      return;
    }

    fetchEvents();
  }

  async function searchStudents(query: string) {
    setStudentSearch(query);

    if (!query.trim()) {
      setStudentResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, email')
      .ilike('full_name', `%${query.trim()}%`)
      .limit(6);

    if (error) return;
    setStudentResults(data || []);
  }

  async function addStudentRegistrant(student: StudentOption) {
    if (!editingOccurrenceId) return;
    setAddingRegistrant(true);

    const { error } = await supabase.from('event_registrations').insert({
      occurrence_id: editingOccurrenceId,
      student_id: student.id,
      status: 'confirmed',
    });

    setAddingRegistrant(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setStudentSearch('');
    setStudentResults([]);
    setRegistrants((prev) => [
      ...prev,
      { id: `temp-${student.id}`, name: student.full_name, status: 'confirmed', isGuest: false },
    ]);
    fetchEvents();
  }

  async function addGuestRegistrant() {
    if (!editingOccurrenceId) return;

    if (!guestForm.name.trim()) {
      setFormError('Enter a name for the guest registrant.');
      return;
    }

    setAddingRegistrant(true);

    const { error } = await supabase.from('event_registrations').insert({
      occurrence_id: editingOccurrenceId,
      guest_name: guestForm.name.trim(),
      guest_phone: guestForm.phone.trim() || null,
      guest_email: guestForm.email.trim() || null,
      status: 'confirmed',
    });

    setAddingRegistrant(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setRegistrants((prev) => [
      ...prev,
      { id: `temp-${guestForm.name}`, name: guestForm.name.trim(), status: 'confirmed', isGuest: true },
    ]);
    setGuestForm({ name: '', phone: '', email: '' });
    fetchEvents();
  }

  const [signingUpId, setSigningUpId] = useState<string | null>(null);

  async function signUpForEvent(occ: EventOccurrence) {
    setSigningUpId(occ.id);

    const studentId = await getCurrentStudentId();

    if (!studentId) {
      alert('Unable to identify your student profile.');
      setSigningUpId(null);
      return;
    }

    const { error } = await supabase.from('event_registrations').insert({
      occurrence_id: occ.id,
      student_id: studentId,
      status: 'confirmed',
    });

    setSigningUpId(null);

    if (error) {
      alert(`Failed to sign up: ${error.message}`);
      return;
    }

    setStudentEventIds((prev) => new Set(prev).add(occ.id));
    fetchEvents();
  }

  async function removeRegistrant(registrantId: string) {
    if (registrantId.startsWith('temp-')) return;

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', registrantId);

    if (error) {
      alert(`Failed to remove registrant: ${error.message}`);
      return;
    }

    setRegistrants((prev) => prev.filter((r) => r.id !== registrantId));
    fetchEvents();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl text-[#284342]">Events</h1>
          <p className="text-[#6b6b6b] mt-1">
            {isStudentView
              ? 'Events you\'re registered for, plus any open for sign-up.'
              : isLeadership
              ? 'Every event across the academy — workshops, open houses, trial classes and 1-on-1 consultations.'
              : "Events you're involved in organizing."}
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => openCreateModal()}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Event
          </button>
        )}
      </div>

      {!isStudentView && !isLeadership && (
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] flex items-center gap-3">
          <span className="text-sm text-[#284342]">Show:</span>
          <button
            onClick={() => setScope('mine')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              scope === 'mine'
                ? 'bg-[#284342] text-[#e9da95]'
                : 'bg-white text-[#284342] border border-[rgba(40,67,66,0.2)]'
            }`}
          >
            I'm Organizing
          </button>
          <button
            onClick={() => setScope('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              scope === 'all'
                ? 'bg-[#284342] text-[#e9da95]'
                : 'bg-white text-[#284342] border border-[rgba(40,67,66,0.2)]'
            }`}
          >
            All Events
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading events...
        </div>
      )}

      {!loading && (
        <>
          <EventSection
            title="Upcoming"
            events={upcomingEvents}
            emptyMessage={
              isStudentView
                ? "You're not registered for any events, and nothing is open for sign-up right now."
                : 'No upcoming events.'
            }
            canManage={canManage}
            onEdit={openEditModal}
            onCancel={cancelEvent}
            isStudentView={isStudentView}
            studentEventIds={studentEventIds}
            onSignUp={signUpForEvent}
            signingUpId={signingUpId}
            onViewRegistrants={setViewingRegistrantsOcc}
          />

          {pastEvents.length > 0 && (
            <EventSection
              title="Past & Cancelled"
              events={pastEvents}
              emptyMessage=""
              canManage={canManage}
              onEdit={openEditModal}
              onCancel={cancelEvent}
              isStudentView={isStudentView}
              studentEventIds={studentEventIds}
              onSignUp={signUpForEvent}
              signingUpId={signingUpId}
              onViewRegistrants={setViewingRegistrantsOcc}
              muted
            />
          )}
        </>
      )}

      {showModal && canManage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">
                {editingOccurrenceId ? 'Edit Event' : 'Add Event'}
              </h2>
              <button onClick={closeModal} className="text-[#6b6b6b] hover:text-[#284342]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Trial Class — Bridal Makeup, Open House"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">Event Type</label>
                  <select
                    value={form.eventKind}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventKind: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  >
                    {EVENT_KIND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#284342] mb-2">Venue</label>
                  <select
                    value={form.venueId}
                    onChange={(e) => setForm((prev) => ({ ...prev, venueId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  >
                    <option value="">No venue set</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.room_name}
                      </option>
                    ))}
                    <option value={OTHER_VENUE}>Other (enter manually)</option>
                  </select>
                  {form.venueId === OTHER_VENUE && (
                    <input
                      value={form.venueOther}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, venueOther: e.target.value }))
                      }
                      placeholder="e.g., Client's home, Sunway Convention Centre"
                      className="w-full mt-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#284342] mb-2">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#284342] mb-2">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Staff Involved{' '}
                  <span className="text-xs text-[#6b6b6b] font-normal">
                    (any teacher added here has this time locked on their availability)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[rgba(40,67,66,0.15)] bg-[#f8f8f6] max-h-40 overflow-y-auto">
                  {staffOptions.length === 0 && (
                    <p className="text-xs text-[#6b6b6b]">Loading staff...</p>
                  )}
                  {staffOptions.map((staff) => {
                    const selected = selectedStaffIds.has(staff.id);
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => toggleStaff(staff.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          selected
                            ? 'bg-[#284342] text-[#e9da95] border-[#284342]'
                            : 'bg-white text-[#284342] border-[rgba(40,67,66,0.2)] hover:bg-white/60'
                        }`}
                      >
                        {staff.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    Capacity (optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.capacity}
                    onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#284342] mb-2">Price (optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[rgba(40,67,66,0.15)] bg-[#f8f8f6] space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.registrationOpen}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, registrationOpen: e.target.checked }))
                    }
                    className="w-4 h-4 accent-[#284342]"
                  />
                  <span className="text-sm text-[#284342]">
                    Open registration — let students sign themselves up
                  </span>
                </label>

                {form.registrationOpen && (
                  <div>
                    <label className="block text-sm text-[#284342] mb-2">
                      Registration Deadline (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={form.registrationDeadline}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, registrationDeadline: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                    />
                    <p className="text-[11px] text-[#6b6b6b] mt-1.5">
                      Leave blank to keep registration open until you close it manually.
                      Staff can still add registrants directly at any time.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-[rgba(40,67,66,0.15)] bg-[#f8f8f6] space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.publicRegistrationEnabled}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        publicRegistrationEnabled: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#284342]"
                  />
                  <span className="text-sm text-[#284342]">
                    Allow external signup — anyone with the link can register, no login needed
                  </span>
                </label>

                {form.publicRegistrationEnabled && editingOccurrenceId && (
                  <div>
                    <label className="block text-sm text-[#284342] mb-2">
                      Shareable signup link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${window.location.origin}/register/${editingOccurrenceId}`}
                        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white text-sm text-[#6b6b6b]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${window.location.origin}/register/${editingOccurrenceId}`
                          )
                        }
                        className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-white transition-colors flex items-center gap-1.5 text-sm shrink-0"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {form.publicRegistrationEnabled && !editingOccurrenceId && (
                  <p className="text-[11px] text-[#6b6b6b]">
                    Save the event first — the signup link becomes available once it exists.
                  </p>
                )}

                <div>
                  <label className="block text-sm text-[#284342] mb-2 flex items-center gap-1.5">
                    <Link2 size={13} />
                    External registration link (optional)
                  </label>
                  <input
                    value={form.externalRegistrationUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, externalRegistrationUrl: e.target.value }))
                    }
                    placeholder="https://partner-company.com/signup"
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                  <p className="text-[11px] text-[#6b6b6b] mt-1.5">
                    If a partner is running registration on their own platform, paste their
                    link here for reference. Signups made there aren't tracked in this system.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              {editingOccurrenceId && (
                <div className="p-4 bg-[#f8f8f6] rounded-lg border border-[rgba(40,67,66,0.1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#284342]">Registrants</p>
                    <span className="text-xs text-[#6b6b6b]">
                      {registrants.length}
                      {form.capacity ? ` / ${form.capacity}` : ''} registered
                    </span>
                  </div>

                  {form.capacity && (
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[rgba(40,67,66,0.1)]">
                      <div
                        className={`h-full rounded-full ${
                          registrants.length >= Number(form.capacity)
                            ? 'bg-red-500'
                            : 'bg-[#284342]'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (registrants.length / Number(form.capacity)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  )}

                  {form.capacity && registrants.length >= Number(form.capacity) && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Capacity reached — self-serve and public signup are now closed. You can
                      still add registrants manually below if needed.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {registrants.length === 0 && (
                      <p className="text-xs text-[#6b6b6b]">No one registered yet.</p>
                    )}
                    {registrants.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white border border-[rgba(40,67,66,0.15)] text-[#284342]"
                      >
                        {r.name}
                        {r.isGuest && <span className="text-[#6b6b6b]">(guest)</span>}
                        <button
                          onClick={() => removeRegistrant(r.id)}
                          className="text-[#6b6b6b] hover:text-red-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                    />
                    <input
                      value={studentSearch}
                      onChange={(e) => searchStudents(e.target.value)}
                      placeholder="Add an existing student by name..."
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342] text-sm"
                    />
                    {studentResults.length > 0 && (
                      <div className="mt-1 bg-white border border-[rgba(40,67,66,0.15)] rounded-lg overflow-hidden">
                        {studentResults.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => addStudentRegistrant(s)}
                            disabled={addingRegistrant}
                            className="w-full text-left px-3 py-2 text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center justify-between"
                          >
                            <span>{s.full_name}</span>
                            <span className="text-xs text-[#6b6b6b]">{s.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={guestForm.name}
                      onChange={(e) => setGuestForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Guest / lead name"
                      className="px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342] text-sm"
                    />
                    <input
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone (optional)"
                      className="px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342] text-sm"
                    />
                    <button
                      onClick={addGuestRegistrant}
                      disabled={addingRegistrant}
                      className="px-3 py-2 rounded-lg bg-[#284342] text-[#e9da95] text-sm hover:bg-[#1a2f2e] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={14} />
                      Add Guest
                    </button>
                  </div>
                  <p className="text-[11px] text-[#6b6b6b]">
                    Use "Guest / lead" for a prospective student who isn't in the system yet —
                    handy for trial classes booked with a new lead.
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
                Cancel
              </button>
              <button
                onClick={saveEvent}
                disabled={saving}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingOccurrenceId ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingRegistrantsOcc && (
        <RegistrantsModal
          occ={viewingRegistrantsOcc}
          onClose={() => setViewingRegistrantsOcc(null)}
        />
      )}
    </div>
  );
}

function RegistrantsModal({
  occ,
  onClose,
}: {
  occ: EventOccurrence;
  onClose: () => void;
}) {
  const full = occ.capacity != null && occ.registrants.length >= occ.capacity;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-[#284342]">Registrants</h2>
            <p className="text-sm text-[#6b6b6b] mt-1">{occ.title}</p>
          </div>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-[#284342]">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#284342]">
            {occ.registrants.length}
            {occ.capacity ? ` / ${occ.capacity}` : ''} registered
          </span>
          {full && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              Full
            </span>
          )}
        </div>

        {occ.capacity && (
          <div className="w-full h-2 bg-[#f8f8f6] rounded-full overflow-hidden border border-[rgba(40,67,66,0.1)] mb-4">
            <div
              className={`h-full rounded-full ${full ? 'bg-red-500' : 'bg-[#284342]'}`}
              style={{
                width: `${Math.min(100, (occ.registrants.length / occ.capacity) * 100)}%`,
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          {occ.registrants.length === 0 && (
            <p className="text-sm text-[#6b6b6b] py-4 text-center">No one registered yet.</p>
          )}

          {occ.registrants.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f8f8f6] border border-[rgba(40,67,66,0.1)]"
            >
              <span className="text-sm text-[#284342]">{r.name}</span>
              {r.isGuest && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-[rgba(40,67,66,0.15)] text-[#6b6b6b]">
                  Guest
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function EventSection({
  title,
  events,
  emptyMessage,
  canManage,
  onEdit,
  onCancel,
  isStudentView,
  studentEventIds,
  onSignUp,
  signingUpId,
  onViewRegistrants,
  muted,
}: {
  title: string;
  events: EventOccurrence[];
  emptyMessage: string;
  canManage: boolean;
  onEdit: (occ: EventOccurrence) => void;
  onCancel: (occ: EventOccurrence) => void;
  isStudentView: boolean;
  studentEventIds: Set<string>;
  onSignUp: (occ: EventOccurrence) => void;
  signingUpId: string | null;
  onViewRegistrants: (occ: EventOccurrence) => void;
  muted?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
      <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
        <h2 className="text-lg text-[#284342]">{title}</h2>
      </div>

      <div className="divide-y divide-[rgba(40,67,66,0.1)]">
        {events.length === 0 && emptyMessage && (
          <div className="p-6 text-center text-[#6b6b6b]">{emptyMessage}</div>
        )}

        {events.map((occ) => (
          <div
            key={occ.id}
            className={`p-6 hover:bg-[#f8f8f6] transition-colors ${muted ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg text-[#284342]">{occ.title}</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                    {eventKindLabel(occ.eventKind)}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      occ.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : occ.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {occ.status}
                  </span>
                  {occ.status === 'scheduled' && <RegistrationBadge occ={occ} />}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Info icon={<Calendar size={14} />} label="Date" value={occ.date} />
                  <Info
                    icon={<Clock size={14} />}
                    label="Time"
                    value={`${occ.startTime} - ${occ.endTime}`}
                  />
                  <Info icon={<MapPin size={14} />} label="Venue" value={occ.venueName} />
                  <Info
                    icon={<Users size={14} />}
                    label="Registered"
                    value={`${occ.registrants.length}${occ.capacity ? ` / ${occ.capacity}` : ''}`}
                  />
                </div>

                {occ.staff.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs text-[#6b6b6b]">Staff:</span>
                    {occ.staff.map((s) => (
                      <span
                        key={s.id}
                        className="text-xs px-2.5 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {canManage && occ.status !== 'cancelled' && (
              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <button
                  onClick={() => onEdit(occ)}
                  className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => onCancel(occ)}
                  className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors text-sm flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Cancel Event
                </button>
                <button
                  onClick={() => onViewRegistrants(occ)}
                  className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-1.5"
                >
                  <Users size={14} />
                  Registrants ({occ.registrants.length}
                  {occ.capacity ? `/${occ.capacity}` : ''})
                </button>
              </div>
            )}

            {!canManage && !isStudentView && occ.registrants.length > 0 && (
              <div className="pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <button
                  onClick={() => onViewRegistrants(occ)}
                  className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-1.5"
                >
                  <Users size={14} />
                  View Registrants
                </button>
              </div>
            )}

            {isStudentView && occ.status === 'scheduled' && (
              <div className="pt-4 border-t border-[rgba(40,67,66,0.1)]">
                {studentEventIds.has(occ.id) ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                    <ClipboardCheck size={16} />
                    You're registered
                  </span>
                ) : isRegistrationOpenNow(occ) && !isEventFull(occ) ? (
                  <button
                    onClick={() => onSignUp(occ)}
                    disabled={signingUpId === occ.id}
                    className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm disabled:opacity-50"
                  >
                    {signingUpId === occ.id ? 'Signing up...' : 'Sign Up'}
                  </button>
                ) : isEventFull(occ) ? (
                  <span className="text-sm text-[#6b6b6b]">Event is full.</span>
                ) : (
                  <span className="text-sm text-[#6b6b6b]">Registration is closed.</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistrationBadge({ occ }: { occ: EventOccurrence }) {
  if (!occ.registrationOpen) {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-[#f8f8f6] text-[#6b6b6b] border border-[rgba(40,67,66,0.1)]">
        Registration Closed
      </span>
    );
  }

  if (isEventFull(occ)) {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700">
        Full
      </span>
    );
  }

  if (!isRegistrationOpenNow(occ)) {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-[#f8f8f6] text-[#6b6b6b] border border-[rgba(40,67,66,0.1)]">
        Registration Closed
      </span>
    );
  }

  return (
    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
      {occ.registrationDeadline
        ? `Open until ${new Date(occ.registrationDeadline).toLocaleDateString()}`
        : 'Open Registration'}
    </span>
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

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function isRegistrationOpenNow(occ: EventOccurrence) {
  if (!occ.registrationOpen || occ.status !== 'scheduled') return false;
  if (occ.registrationDeadline && new Date() > new Date(occ.registrationDeadline)) {
    return false;
  }
  return true;
}

function isEventFull(occ: EventOccurrence) {
  return occ.capacity != null && occ.registrants.length >= occ.capacity;
}

// datetime-local inputs want "YYYY-MM-DDTHH:mm" in the viewer's local time,
// not the UTC ISO string Postgres returns.
function toLocalDateTimeInputValue(isoString: string) {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
