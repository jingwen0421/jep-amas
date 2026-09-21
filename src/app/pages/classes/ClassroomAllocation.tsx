import { useEffect, useState } from 'react';
import {
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { useLanguage } from '../../context/LanguageContext';

interface Classroom {
  id: string;
  name: string;
  capacity: number | null;
  status: string;
}

interface RoomBooking {
  id: string;
  classroomId: string;
  title: string;
  sourceTable: string;
  startTime: string;
  endTime: string;
  startsAt: string;
  endsAt: string;
}

const SOURCE_LABEL_KEYS: Record<string, string> = {
  lessons: 'classroomAllocation.source.class',
  makeup_classes: 'classroomAllocation.source.makeupClass',
  event_occurrences: 'classroomAllocation.source.event',
  room_rentals: 'classroomAllocation.source.roomRental',
  appointments: 'classroomAllocation.source.appointment',
};

export default function ClassroomAllocation() {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const canManage =
    currentUser.role === 'super_admin' || currentUser.role === 'admin';

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    classroomId: '',
    renterName: '',
    renterContact: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '',
    endTime: '',
    price: '',
    notes: '',
  });
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, classrooms.length]);

  async function fetchClassrooms() {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, room_name, capacity, status')
      .order('room_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch classrooms:', error.message);
      setLoading(false);
      return;
    }

    setClassrooms(
      (data || []).map((r: any) => ({
        id: r.id,
        name: r.room_name,
        capacity: r.capacity,
        status: r.status,
      }))
    );
  }

  async function fetchBookings() {
    if (classrooms.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const dayStart = `${selectedDate}T00:00:00`;
    const dayEnd = `${selectedDate}T23:59:59`;

    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, source_table, venue_id, starts_at, ends_at, status')
      .in(
        'venue_id',
        classrooms.map((c) => c.id)
      )
      .neq('status', 'cancelled')
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .order('starts_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch room bookings:', error.message);
      setLoading(false);
      return;
    }

    setBookings(
      (data || []).map((row: any) => ({
        id: row.id,
        classroomId: row.venue_id,
        title: row.title,
        sourceTable: row.source_table,
        startTime: new Date(row.starts_at).toTimeString().slice(0, 5),
        endTime: new Date(row.ends_at).toTimeString().slice(0, 5),
        startsAt: row.starts_at,
        endsAt: row.ends_at,
      }))
    );

    setLoading(false);
  }

  function roomStatusNow(classroomId: string): 'Occupied' | 'Available' {
    const now = new Date();
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);
    if (!isToday) return 'Available';

    const current = bookings.find(
      (b) =>
        b.classroomId === classroomId &&
        new Date(b.startsAt) <= now &&
        now <= new Date(b.endsAt)
    );

    return current ? 'Occupied' : 'Available';
  }

  function currentBookingFor(classroomId: string) {
    const now = new Date();
    return bookings.find(
      (b) =>
        b.classroomId === classroomId &&
        new Date(b.startsAt) <= now &&
        now <= new Date(b.endsAt)
    );
  }

  async function submitBooking() {
    setBookingError(null);

    if (!bookingForm.classroomId) {
      setBookingError(t('classroomAllocation.error.selectRoom'));
      return;
    }
    if (!bookingForm.renterName.trim()) {
      setBookingError(t('classroomAllocation.error.enterRenterName'));
      return;
    }
    if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) {
      setBookingError(t('classroomAllocation.error.selectDateTime'));
      return;
    }

    const startsAt = `${bookingForm.date}T${bookingForm.startTime}:00`;
    const endsAt = `${bookingForm.date}T${bookingForm.endTime}:00`;

    if (endsAt <= startsAt) {
      setBookingError(t('classroomAllocation.error.endAfterStart'));
      return;
    }

    setSavingBooking(true);

    const { error } = await supabase.from('room_rentals').insert({
      classroom_id: bookingForm.classroomId,
      renter_name: bookingForm.renterName.trim(),
      renter_contact: bookingForm.renterContact.trim() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      price: bookingForm.price ? Number(bookingForm.price) : null,
      notes: bookingForm.notes.trim() || null,
      created_by: currentUser.id || null,
    });

    setSavingBooking(false);

    if (error) {
      setBookingError(error.message);
      return;
    }

    setShowBookingModal(false);
    setBookingForm({
      classroomId: '',
      renterName: '',
      renterContact: '',
      date: new Date().toISOString().slice(0, 10),
      startTime: '',
      endTime: '',
      price: '',
      notes: '',
    });

    if (bookingForm.date === selectedDate) {
      fetchBookings();
    }
  }

  const availableCount = classrooms.filter(
    (r) => roomStatusNow(r.id) === 'Available'
  ).length;
  const occupiedCount = classrooms.filter(
    (r) => roomStatusNow(r.id) === 'Occupied'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('classroomAllocation.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('classroomAllocation.subtitle')}
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setBookingForm((prev) => ({ ...prev, date: selectedDate }));
              setBookingError(null);
              setShowBookingModal(true);
            }}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            {t('classroomAllocation.bookRental')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-4">
          <label className="text-sm text-[#284342]">{t('classroomAllocation.viewDate')}</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {classrooms.map((room) => {
          const status = roomStatusNow(room.id);
          const current = currentBookingFor(room.id);
          const roomBookings = bookings.filter((b) => b.classroomId === room.id);

          return (
            <div
              key={room.id}
              className={`rounded-xl p-6 border transition-all ${
                status === 'Available'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-[#284342]" />
                  <h3 className="text-lg text-[#284342]">{room.name}</h3>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    status === 'Available'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {status === 'Available'
                    ? t('classroomAllocation.status.available')
                    : t('classroomAllocation.status.occupied')}
                </span>
              </div>

              <div className="mb-4">
                {room.capacity != null && (
                  <div className="flex items-center gap-2 text-sm text-[#6b6b6b] mb-2">
                    <Users size={16} />
                    <span>{t('classroomAllocation.capacity', { count: room.capacity })}</span>
                  </div>
                )}

                {current && (
                  <div className="p-3 bg-white rounded-lg mb-2">
                    <p className="text-xs text-[#6b6b6b] mb-1">
                      {t(SOURCE_LABEL_KEYS[current.sourceTable] || 'classroomAllocation.source.booking')}:
                    </p>
                    <p className="text-sm text-[#284342]">{current.title}</p>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      {t('classroomAllocation.until', { time: current.endTime })}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#6b6b6b] mb-2">
                  {t('classroomAllocation.bookingsOn', { count: roomBookings.length, date: selectedDate })}
                </p>
                {roomBookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-700 shrink-0" />
                    <span className="text-xs text-[#6b6b6b] truncate">
                      {b.startTime} {b.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('classroomAllocation.roomBookingsFor', { date: selectedDate })}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('classroomAllocation.field.room')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('classroomAllocation.field.title')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('classroomAllocation.field.type')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('classroomAllocation.field.time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('classroomAllocation.loadingBookings')}
                  </td>
                </tr>
              )}

              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('classroomAllocation.noBookings')}
                  </td>
                </tr>
              )}

              {!loading &&
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {classrooms.find((c) => c.id === booking.classroomId)?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{booking.title}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#f8f8f6] border border-[rgba(40,67,66,0.1)] text-[#284342]">
                        {SOURCE_LABEL_KEYS[booking.sourceTable]
                          ? t(SOURCE_LABEL_KEYS[booking.sourceTable])
                          : booking.sourceTable}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] text-center">
          <p className="text-3xl text-[#284342] mb-2">{classrooms.length}</p>
          <p className="text-sm text-[#6b6b6b]">{t('classroomAllocation.totalRooms')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] text-center">
          <p className="text-3xl text-green-700 mb-2">{availableCount}</p>
          <p className="text-sm text-[#6b6b6b]">{t('classroomAllocation.availableNow')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] text-center">
          <p className="text-3xl text-yellow-700 mb-2">{occupiedCount}</p>
          <p className="text-sm text-[#6b6b6b]">{t('classroomAllocation.occupiedNow')}</p>
        </div>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">{t('classroomAllocation.bookRoomRental')}</h2>
              <button onClick={() => setShowBookingModal(false)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">{t('classroomAllocation.field.room')}</label>
                <select
                  value={bookingForm.classroomId}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, classroomId: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="">{t('classroomAllocation.selectRoom')}</option>
                  {classrooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">{t('classroomAllocation.renterName')}</label>
                <input
                  value={bookingForm.renterName}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, renterName: e.target.value }))
                  }
                  placeholder={t('classroomAllocation.renterNamePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('classroomAllocation.renterContactOptional')}
                </label>
                <input
                  value={bookingForm.renterContact}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, renterContact: e.target.value }))
                  }
                  placeholder={t('classroomAllocation.phoneOrEmailPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">{t('classroomAllocation.field.date')}</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#284342] mb-2">{t('classroomAllocation.field.start')}</label>
                  <input
                    type="time"
                    value={bookingForm.startTime}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#284342] mb-2">{t('classroomAllocation.field.end')}</label>
                  <input
                    type="time"
                    value={bookingForm.endTime}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('classroomAllocation.priceOptional')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bookingForm.price}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('classroomAllocation.notesOptional')}
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                />
              </div>

              {bookingError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-700 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800">{bookingError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('classroomAllocation.cancel')}
              </button>
              <button
                onClick={submitBooking}
                disabled={savingBooking}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
              >
                {savingBooking ? t('classroomAllocation.booking') : t('classroomAllocation.bookRental')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
