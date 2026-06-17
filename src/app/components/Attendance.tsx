import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const attendanceData = [
  {
    id: 1,
    studentName: "Wong Xiao Ming",
    course: "Makeup Artistry",
    date: "2026-05-30",
    status: "Present",
    checkIn: "9:02 AM",
    avatar: "NA",
  },
  {
    id: 2,
    studentName: "Tan Da Ai",
    course: "Bridal Makeup",
    date: "2026-05-30",
    status: "Present",
    checkIn: "9:12 AM",
    avatar: "SN",
  },
  {
    id: 3,
    studentName: "Lee Mei Ling",
    course: "Hair Styling",
    date: "2026-05-30",
    status: "Absent",
    checkIn: "-",
    avatar: "LM",
  },
  {
    id: 4,
    studentName: "Kavitho",
    course: "Skincare & Facial",
    date: "2026-05-30",
    status: "Present",
    checkIn: "8:58 AM",
    avatar: "KD",
  },
  {
    id: 5,
    studentName: "Farah",
    course: "Nail Art",
    date: "2026-05-30",
    status: "Late",
    checkIn: "9:38 AM",
    avatar: "FA",
  },
  {
    id: 6,
    studentName: "Tan Xiao Wei",
    course: "Makeup Artistry",
    date: "2026-05-30",
    status: "Present",
    checkIn: "9:07 AM",
    avatar: "TX",
  },
];

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedDate, setSelectedDate] =
    useState("2026-05-30");

  const filteredAttendance = attendanceData.filter((record) => {
    const matchesSearch =
      record.studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.course
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "All" || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const presentCount = attendanceData.filter(
    (r) => r.status === "Present",
  ).length;
  const absentCount = attendanceData.filter(
    (r) => r.status === "Absent",
  ).length;
  const lateCount = attendanceData.filter(
    (r) => r.status === "Late",
  ).length;
  const attendanceRate = Math.round(
    (presentCount / attendanceData.length) * 100,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: "#284342" }}>
            Attendance Management
          </h1>
          <p style={{ color: "#6b6b6b" }}>
            Track and manage student attendance
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: "#284342", color: "#e9da95" }}
        >
          <CalendarIcon className="w-5 h-5" />
          Mark Attendance
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: "#6b6b6b" }}>Present</p>
            <CheckCircle
              className="w-5 h-5"
              style={{ color: "#284342" }}
            />
          </div>
          <h2 style={{ color: "#284342" }}>{presentCount}</h2>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: "#6b6b6b" }}>Absent</p>
            <XCircle
              className="w-5 h-5"
              style={{ color: "#d4183d" }}
            />
          </div>
          <h2 style={{ color: "#284342" }}>{absentCount}</h2>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: "#6b6b6b" }}>Late</p>
            <Clock
              className="w-5 h-5"
              style={{ color: "#e9da95" }}
            />
          </div>
          <h2 style={{ color: "#284342" }}>{lateCount}</h2>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p style={{ color: "#6b6b6b" }}>Attendance Rate</p>
          <h2 style={{ color: "#284342" }}>
            {attendanceRate}%
          </h2>
        </div>
      </div>

      {/* Date and Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "#6b6b6b" }}
            />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{ borderColor: "rgba(40, 67, 66, 0.2)" }}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "rgba(40, 67, 66, 0.2)",
                color: "#284342",
              }}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "rgba(40, 67, 66, 0.2)",
                color: "#284342",
              }}
            >
              <option>All</option>
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              style={{ background: "rgba(233, 218, 149, 0.1)" }}
            >
              <tr>
                <th
                  className="text-left p-4"
                  style={{ color: "#284342" }}
                >
                  Student
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#284342" }}
                >
                  Course
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#284342" }}
                >
                  Date
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#284342" }}
                >
                  Check-in Time
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#284342" }}
                >
                  Status
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#284342" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr
                  key={record.id}
                  className="border-t"
                  style={{
                    borderColor: "rgba(40, 67, 66, 0.1)",
                  }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "#284342",
                          color: "#e9da95",
                        }}
                      >
                        {record.avatar}
                      </div>
                      <div>
                        <p style={{ color: "#284342" }}>
                          {record.studentName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p style={{ color: "#6b6b6b" }}>
                      {record.course}
                    </p>
                  </td>
                  <td className="p-4">
                    <p style={{ color: "#6b6b6b" }}>
                      {record.date}
                    </p>
                  </td>
                  <td className="p-4">
                    <p style={{ color: "#6b6b6b" }}>
                      {record.checkIn}
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm flex items-center gap-2 w-fit"
                      style={{
                        background:
                          record.status === "Present"
                            ? "rgba(40, 67, 66, 0.1)"
                            : record.status === "Late"
                              ? "rgba(233, 218, 149, 0.3)"
                              : "rgba(212, 24, 61, 0.1)",
                        color:
                          record.status === "Absent"
                            ? "#d4183d"
                            : "#284342",
                      }}
                    >
                      {record.status === "Present" && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {record.status === "Absent" && (
                        <XCircle className="w-4 h-4" />
                      )}
                      {record.status === "Late" && (
                        <Clock className="w-4 h-4" />
                      )}
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
                      style={{
                        background: "rgba(40, 67, 66, 0.1)",
                        color: "#284342",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}