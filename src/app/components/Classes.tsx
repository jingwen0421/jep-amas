import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
} from "lucide-react";

interface ClassSession {
  id: number;
  title: string;
  teacher: string;
  students: string[];
  time: string;
  duration: string;
  room: string;
  date: string;
  status: "scheduled" | "completed" | "cancelled";
  color: string;
}

const classesData: ClassSession[] = [
  {
    id: 1,
    title: "Makeup Artistry - Foundation Basics",
    teacher: "Juju Lim",
    students: ["Nur Aisyah", "Tan Xiao Wei", "Siti Aminah"],
    time: "09:00",
    duration: "2 hours",
    room: "Studio A",
    date: "2026-05-30",
    status: "scheduled",
    color: "#284342",
  },
  {
    id: 2,
    title: "Bridal Makeup Session",
    teacher: "Esther",
    students: ["Siti Nurhaliza", "Kavitha Devi"],
    time: "11:00",
    duration: "3 hours",
    room: "Studio B",
    date: "2026-05-30",
    status: "scheduled",
    color: "#6b8e8d",
  },
  {
    id: 3,
    title: "Hair Styling",
    teacher: "Wong Yi Feng",
    students: ["Lee Mei Ling", "Farah Amelia"],
    time: "14:00",
    duration: "2 hours",
    room: "Studio C",
    date: "2026-05-30",
    status: "scheduled",
    color: "#e9da95",
  },
  {
    id: 4,
    title: "Skincare Theory",
    teacher: "Pauline Tang",
    students: ["Kavitha Devi", "Nur Aisyah", "Tan Xiao Wei"],
    time: "10:00",
    duration: "1.5 hours",
    room: "Room 101",
    date: "2026-05-31",
    status: "scheduled",
    color: "#284342",
  },
];

const teachers = [
  "Juju Lim",
  "Esther",
  "Wong Yi Feng",
  "Pauline Tang",
];

const timeSlots = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export default function Classes() {
  const [selectedDate, setSelectedDate] = useState(
    new Date(2026, 4, 30),
  );
  const [view, setView] = useState<"week" | "day">("week");
  const [showBookingModal, setShowBookingModal] =
    useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    teacher: string;
  } | null>(null);
  const [showNotification, setShowNotification] =
    useState(false);

  const getDaysInWeek = (date: Date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getDaysInWeek(selectedDate);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getClassesForDateAndTime = (
    date: Date,
    time: string,
  ) => {
    const dateStr = formatDate(date);
    return classesData.filter(
      (cls) => cls.date === dateStr && cls.time === time,
    );
  };

  const isSlotBooked = (
    date: Date,
    time: string,
    teacher: string,
  ) => {
    const dateStr = formatDate(date);
    return classesData.some(
      (cls) =>
        cls.date === dateStr &&
        cls.time === time &&
        cls.teacher === teacher,
    );
  };

  const handleSlotClick = (
    date: Date,
    time: string,
    teacher: string,
  ) => {
    const dateStr = formatDate(date);
    const isBooked = isSlotBooked(date, time, teacher);

    if (isBooked) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else {
      setSelectedSlot({ date: dateStr, time, teacher });
      setShowBookingModal(true);
    }
  };

  const handleBooking = () => {
    setShowBookingModal(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const previousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {showNotification && (
        <div
          className="fixed top-20 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in"
          style={{ background: "#284342", color: "#e9da95" }}
        >
          <Bell className="w-5 h-5" />
          <div>
            <p className="font-medium">Notification Sent</p>
            <p
              className="text-sm"
              style={{ color: "rgba(233, 218, 149, 0.8)" }}
            >
              Teacher and student have been notified
            </p>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="mb-4" style={{ color: "#284342" }}>
              Book Appointment
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label
                  className="block mb-2"
                  style={{ color: "#284342" }}
                >
                  Teacher
                </label>
                <input
                  type="text"
                  value={selectedSlot?.teacher || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.2)",
                    background: "#f8f8f6",
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{ color: "#284342" }}
                >
                  Date
                </label>
                <input
                  type="text"
                  value={selectedSlot?.date || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.2)",
                    background: "#f8f8f6",
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{ color: "#284342" }}
                >
                  Time
                </label>
                <input
                  type="text"
                  value={selectedSlot?.time || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.2)",
                    background: "#f8f8f6",
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{ color: "#284342" }}
                >
                  Student Name
                </label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.2)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{ color: "#284342" }}
                >
                  Class Type
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.2)",
                    color: "#284342",
                  }}
                >
                  <option>Makeup Artistry</option>
                  <option>Bridal Makeup</option>
                  <option>Hair Styling</option>
                  <option>Skincare & Facial</option>
                  <option>Nail Art</option>
                  <option>Lash Extension</option>
                </select>
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{ color: "#284342" }}
                >
                  Duration
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.2)",
                    color: "#284342",
                  }}
                >
                  <option>1 hour</option>
                  <option>1.5 hours</option>
                  <option>2 hours</option>
                  <option>3 hours</option>
                </select>
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{ color: "#284342" }}
                >
                  Room
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.2)",
                    color: "#284342",
                  }}
                >
                  <option>Studio A</option>
                  <option>Studio B</option>
                  <option>Studio C</option>
                  <option>Studio D</option>
                  <option>Room 101</option>
                  <option>Room 102</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: "rgba(40, 67, 66, 0.1)",
                  color: "#284342",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                className="flex-1 px-4 py-3 rounded-xl transition-all hover:opacity-90"
                style={{
                  background: "#284342",
                  color: "#e9da95",
                }}
              >
                Book & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: "#284342" }}>Class Schedule</h1>
          <p style={{ color: "#6b6b6b" }}>
            Manage classes and appointments
          </p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: "#284342", color: "#e9da95" }}
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          className="bg-white rounded-xl p-6 border"
          style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
        >
          <p
            className="text-sm mb-2"
            style={{ color: "#6b6b6b" }}
          >
            Today's Classes
          </p>
          <h2 style={{ color: "#284342" }}>6</h2>
        </div>
        <div
          className="bg-white rounded-xl p-6 border"
          style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
        >
          <p
            className="text-sm mb-2"
            style={{ color: "#6b6b6b" }}
          >
            This Week
          </p>
          <h2 style={{ color: "#284342" }}>28</h2>
        </div>
        <div
          className="bg-white rounded-xl p-6 border"
          style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
        >
          <p
            className="text-sm mb-2"
            style={{ color: "#6b6b6b" }}
          >
            Active Teachers
          </p>
          <h2 style={{ color: "#284342" }}>6</h2>
        </div>
        <div
          className="bg-white rounded-xl p-6 border"
          style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
        >
          <p
            className="text-sm mb-2"
            style={{ color: "#6b6b6b" }}
          >
            Available Rooms
          </p>
          <h2 style={{ color: "#284342" }}>6</h2>
        </div>
      </div>

      {/* Calendar Controls */}
      <div
        className="bg-white rounded-xl p-4 border"
        style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={previousWeek}
              className="p-2 rounded-lg hover:bg-opacity-10"
              style={{ color: "#284342" }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 style={{ color: "#284342" }}>
              {weekDays[0].toLocaleDateString("en-MY", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={nextWeek}
              className="p-2 rounded-lg hover:bg-opacity-10"
              style={{ color: "#284342" }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("day")}
              className={`px-4 py-2 rounded-xl transition-all ${view === "day" ? "" : ""}`}
              style={{
                background:
                  view === "day"
                    ? "#284342"
                    : "rgba(40, 67, 66, 0.1)",
                color: view === "day" ? "#e9da95" : "#284342",
              }}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-xl transition-all`}
              style={{
                background:
                  view === "week"
                    ? "#284342"
                    : "rgba(40, 67, 66, 0.1)",
                color: view === "week" ? "#e9da95" : "#284342",
              }}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      {view === "week" && (
        <div
          className="bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead
                style={{
                  background: "rgba(233, 218, 149, 0.1)",
                }}
              >
                <tr>
                  <th
                    className="p-4 text-left border-r"
                    style={{
                      borderColor: "rgba(40, 67, 66, 0.1)",
                      color: "#284342",
                      minWidth: "120px",
                    }}
                  >
                    Time / Teacher
                  </th>
                  {weekDays.map((day, index) => (
                    <th
                      key={index}
                      className="p-4 text-center border-r"
                      style={{
                        borderColor: "rgba(40, 67, 66, 0.1)",
                        color: "#284342",
                        minWidth: "140px",
                      }}
                    >
                      <div>
                        {day.toLocaleDateString("en-MY", {
                          weekday: "short",
                        })}
                      </div>
                      <div className="text-2xl mt-1">
                        {day.getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, teacherIndex) => (
                  <React.Fragment key={teacher}>
                    <tr
                      style={{
                        background:
                          teacherIndex % 2 === 0
                            ? "#fff"
                            : "rgba(233, 218, 149, 0.05)",
                      }}
                    >
                      <td
                        className="p-4 border-r border-b font-medium"
                        style={{
                          borderColor: "rgba(40, 67, 66, 0.1)",
                          color: "#284342",
                        }}
                      >
                        {teacher}
                      </td>
                      {weekDays.map((day, dayIndex) => {
                        const classes = classesData.filter(
                          (cls) =>
                            cls.date === formatDate(day) &&
                            cls.teacher === teacher,
                        );

                        return (
                          <td
                            key={dayIndex}
                            className="p-2 border-r border-b align-top"
                            style={{
                              borderColor:
                                "rgba(40, 67, 66, 0.1)",
                            }}
                          >
                            <div className="space-y-2">
                              {classes.map((cls) => (
                                <div
                                  key={cls.id}
                                  className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-all"
                                  style={{
                                    background: cls.color,
                                    color:
                                      cls.color === "#e9da95"
                                        ? "#284342"
                                        : "#e9da95",
                                  }}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs">
                                      {cls.time}
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium mb-1">
                                    {cls.title}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span className="text-xs">
                                      {cls.students.length}{" "}
                                      students
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-xs">
                                      {cls.room}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {classes.length === 0 && (
                                <button
                                  onClick={() =>
                                    handleSlotClick(
                                      day,
                                      "09:00",
                                      teacher,
                                    )
                                  }
                                  className="w-full p-2 rounded-lg border-2 border-dashed text-xs hover:bg-opacity-5 transition-all"
                                  style={{
                                    borderColor:
                                      "rgba(40, 67, 66, 0.2)",
                                    color: "#6b6b6b",
                                  }}
                                >
                                  + Add Class
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day View */}
      {view === "day" && (
        <div
          className="bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
        >
          <div
            className="p-4 border-b"
            style={{
              borderColor: "rgba(40, 67, 66, 0.1)",
              background: "rgba(233, 218, 149, 0.1)",
            }}
          >
            <h3 style={{ color: "#284342" }}>
              {selectedDate.toLocaleDateString("en-MY", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {timeSlots.map((time) => {
              const classes = getClassesForDateAndTime(
                selectedDate,
                time,
              );

              return (
                <div key={time} className="flex gap-4">
                  <div className="w-20 flex-shrink-0">
                    <span style={{ color: "#6b6b6b" }}>
                      {time}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="p-4 rounded-xl"
                          style={{
                            background: `${cls.color}15`,
                            borderLeft: `4px solid ${cls.color}`,
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 style={{ color: "#284342" }}>
                              {cls.title}
                            </h4>
                            <span
                              className="px-3 py-1 rounded-full text-xs"
                              style={{
                                background: cls.color,
                                color: "#e9da95",
                              }}
                            >
                              {cls.duration}
                            </span>
                          </div>
                          <p
                            className="text-sm mb-2"
                            style={{ color: "#6b6b6b" }}
                          >
                            Teacher: {cls.teacher}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users
                                className="w-4 h-4"
                                style={{ color: "#6b6b6b" }}
                              />
                              <span
                                style={{ color: "#6b6b6b" }}
                              >
                                {cls.students.join(", ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin
                                className="w-4 h-4"
                                style={{ color: "#6b6b6b" }}
                              />
                              <span
                                style={{ color: "#6b6b6b" }}
                              >
                                {cls.room}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className="p-4 rounded-xl border-2 border-dashed text-center"
                        style={{
                          borderColor: "rgba(40, 67, 66, 0.2)",
                        }}
                      >
                        <p
                          className="text-sm"
                          style={{ color: "#6b6b6b" }}
                        >
                          No classes scheduled
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const React = {
  Fragment: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
};