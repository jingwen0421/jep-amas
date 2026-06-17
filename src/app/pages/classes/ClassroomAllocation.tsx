import { useState } from 'react';
import { MapPin, Users, Calendar, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  status: 'Available' | 'Occupied' | 'Maintenance';
  currentClass?: string;
  nextAvailable?: string;
}

interface RoomBooking {
  id: string;
  room: string;
  course: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  students: number;
}

export default function ClassroomAllocation() {
  const [selectedDate, setSelectedDate] = useState('2026-06-02');

  const classrooms: Classroom[] = [
    {
      id: 'R001',
      name: 'Studio A',
      capacity: 15,
      equipment: ['Professional Lighting', 'Full-length Mirrors', 'Makeup Stations'],
      status: 'Occupied',
      currentClass: 'Bridal Makeup Essentials',
      nextAvailable: '12:00 PM',
    },
    {
      id: 'R002',
      name: 'Studio B',
      capacity: 12,
      equipment: ['Airbrush Equipment', 'Professional Lighting', 'Makeup Stations'],
      status: 'Available',
    },
    {
      id: 'R003',
      name: 'Studio C',
      capacity: 10,
      equipment: ['SFX Equipment', 'Professional Lighting', 'Work Stations'],
      status: 'Available',
    },
    {
      id: 'R004',
      name: 'Practice Room',
      capacity: 8,
      equipment: ['Basic Mirrors', 'Practice Stations'],
      status: 'Maintenance',
      nextAvailable: 'June 5, 2026',
    },
  ];

  const todayBookings: RoomBooking[] = [
    {
      id: 'B001',
      room: 'Studio A',
      course: 'Bridal Makeup Essentials',
      teacher: 'Juju Lim',
      date: '2026-06-02',
      startTime: '09:00',
      endTime: '12:00',
      students: 15,
    },
    {
      id: 'B002',
      room: 'Studio B',
      course: 'Airbrush Techniques',
      teacher: 'Esther',
      date: '2026-06-02',
      startTime: '14:00',
      endTime: '17:00',
      students: 10,
    },
    {
      id: 'B003',
      room: 'Studio A',
      course: 'Portfolio Development',
      teacher: 'Wong Yi Feng',
      date: '2026-06-02',
      startTime: '14:00',
      endTime: '16:00',
      students: 12,
    },
  ];

  const conflicts = todayBookings.filter((booking, index, self) => {
    return self.some((other, otherIndex) => {
      if (index >= otherIndex) return false;
      if (booking.room !== other.room) return false;
      const bookingStart = parseInt(booking.startTime.replace(':', ''));
      const bookingEnd = parseInt(booking.endTime.replace(':', ''));
      const otherStart = parseInt(other.startTime.replace(':', ''));
      const otherEnd = parseInt(other.endTime.replace(':', ''));
      return (bookingStart < otherEnd && bookingEnd > otherStart);
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Classroom Allocation</h1>
        <p className="text-[#6b6b6b] mt-1">Monitor room availability, equipment, and booking conflicts</p>
      </div>

      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-700 mt-0.5" />
            <div>
              <h3 className="text-sm text-red-900 mb-2">Booking Conflicts Detected!</h3>
              <p className="text-sm text-red-800">
                {conflicts.length} room(s) have overlapping bookings. Please resolve conflicts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-4">
          <label className="text-sm text-[#284342]">View Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          />
        </div>
      </div>

      {/* Classroom Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {classrooms.map((room) => (
          <div
            key={room.id}
            className={`rounded-xl p-6 border transition-all ${
              room.status === 'Available'
                ? 'bg-green-50 border-green-200'
                : room.status === 'Occupied'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-[#284342]" />
                <h3 className="text-lg text-[#284342]">{room.name}</h3>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  room.status === 'Available'
                    ? 'bg-green-100 text-green-700'
                    : room.status === 'Occupied'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {room.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-[#6b6b6b] mb-2">
                <Users size={16} />
                <span>Capacity: {room.capacity} students</span>
              </div>

              {room.currentClass && (
                <div className="p-3 bg-white rounded-lg mb-2">
                  <p className="text-xs text-[#6b6b6b] mb-1">Current Class:</p>
                  <p className="text-sm text-[#284342]">{room.currentClass}</p>
                  {room.nextAvailable && (
                    <p className="text-xs text-[#6b6b6b] mt-1">Available: {room.nextAvailable}</p>
                  )}
                </div>
              )}

              {room.status === 'Maintenance' && room.nextAvailable && (
                <div className="p-3 bg-white rounded-lg mb-2">
                  <p className="text-xs text-[#6b6b6b] mb-1">Under Maintenance</p>
                  <p className="text-sm text-[#284342]">Available: {room.nextAvailable}</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#6b6b6b] mb-2">Equipment:</p>
              {room.equipment.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-green-700" />
                  <span className="text-xs text-[#6b6b6b]">{item}</span>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
              View Schedule
            </button>
          </div>
        ))}
      </div>

      {/* Today's Bookings */}
      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Today's Room Bookings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Room</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Teacher</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Time</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Students</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {todayBookings.map((booking) => {
                const hasConflict = conflicts.some((c) => c.id === booking.id);
                return (
                  <tr
                    key={booking.id}
                    className={`hover:bg-[#f8f8f6] transition-colors ${
                      hasConflict ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {booking.room}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{booking.course}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{booking.teacher}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{booking.students}</td>
                    <td className="px-6 py-4">
                      {hasConflict ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700">
                          Conflict
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                          Confirmed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] text-center">
          <p className="text-3xl text-[#284342] mb-2">{classrooms.length}</p>
          <p className="text-sm text-[#6b6b6b]">Total Rooms</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] text-center">
          <p className="text-3xl text-green-700 mb-2">
            {classrooms.filter((r) => r.status === 'Available').length}
          </p>
          <p className="text-sm text-[#6b6b6b]">Available</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] text-center">
          <p className="text-3xl text-yellow-700 mb-2">
            {classrooms.filter((r) => r.status === 'Occupied').length}
          </p>
          <p className="text-sm text-[#6b6b6b]">Occupied</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)] text-center">
          <p className="text-3xl text-red-700 mb-2">{conflicts.length}</p>
          <p className="text-sm text-[#6b6b6b]">Conflicts</p>
        </div>
      </div>

    </div>
  );
}
