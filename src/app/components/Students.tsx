import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  enrollDate: string;
  status: string;
  progress: number;
  avatar: string;
};

export default function Students() {
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching students:", error.message);
        setLoading(false);
        return;
      }

      const mappedStudents: Student[] = (data || []).map((student) => ({
        id: student.id,
        name: student.full_name || student.student_code || "Unnamed Student",
        email: student.email || "-",
        phone: student.phone || "-",
        course: student.course || "-",
        enrollDate: student.enroll_date || student.created_at?.slice(0, 10) || "-",
        status: student.status === "active" ? "Active" : "Pending",
        progress: student.progress || 0,
        avatar:
          student.avatar ||
          student.full_name
            ?.split(" ")
            .map((word: string) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
          "ST",
      }));

      setStudentsData(mappedStudents);
      setLoading(false);
    }

    fetchStudents();
  }, []);

  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "All" || student.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const activeStudents = studentsData.filter(
    (student) => student.status === "Active"
  ).length;

  const pendingStudents = studentsData.filter(
    (student) => student.status === "Pending"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: "#284342" }}>Student Management</h1>
          <p style={{ color: "#6b6b6b" }}>
            Manage and track all student information
          </p>
        </div>

        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: "#284342", color: "#e9da95" }}
        >
          <Plus className="w-5 h-5" />
          Add New Student
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={studentsData.length} />
        <StatCard title="Active Students" value={activeStudents} />
        <StatCard title="Pending Enrollment" value={pendingStudents} />
      </div>

      <div
        className="bg-white rounded-xl p-4 border"
        style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#6b6b6b" }}
            />
            <input
              type="text"
              placeholder="Search students"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: "rgba(40, 67, 66, 0.2)" }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
            style={{
              borderColor: "rgba(40, 67, 66, 0.2)",
              color: "#284342",
            }}
          >
            <option>All</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      <div
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  background: "#f8f8f6",
                  borderBottom: "1px solid rgba(40, 67, 66, 0.1)",
                }}
              >
                {["Student", "Contact", "Course", "Enrolled", "Progress", "Status", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="text-left px-6 py-4 text-sm"
                      style={{ color: "#284342" }}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading students...
                  </td>
                </tr>
              )}

              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: "1px solid rgba(40, 67, 66, 0.1)",
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "#284342",
                            color: "#e9da95",
                          }}
                        >
                          {student.avatar}
                        </div>
                        <p style={{ color: "#284342" }}>{student.name}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" style={{ color: "#6b6b6b" }} />
                          <span className="text-sm" style={{ color: "#6b6b6b" }}>
                            {student.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" style={{ color: "#6b6b6b" }} />
                          <span className="text-sm" style={{ color: "#6b6b6b" }}>
                            {student.phone}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4" style={{ color: "#284342" }}>
                      {student.course}
                    </td>

                    <td className="px-6 py-4" style={{ color: "#6b6b6b" }}>
                      {student.enrollDate}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="text-sm" style={{ color: "#6b6b6b" }}>
                          {student.progress}%
                        </span>
                        <div
                          className="w-24 h-1.5 rounded-full"
                          style={{ background: "rgba(40, 67, 66, 0.1)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${student.progress}%`,
                              background: "#284342",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-md text-sm"
                        style={{
                          background:
                            student.status === "Active"
                              ? "rgba(40, 67, 66, 0.1)"
                              : "rgba(233, 218, 149, 0.3)",
                          color: "#284342",
                        }}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        className="p-2 rounded-lg hover:bg-opacity-10"
                        style={{ color: "#284342" }}
                      >
                        <MoreVertical className="w-4 h-4" />
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

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div
      className="bg-white rounded-xl p-6 border"
      style={{ borderColor: "rgba(40, 67, 66, 0.1)" }}
    >
      <p className="text-sm mb-2" style={{ color: "#6b6b6b" }}>
        {title}
      </p>
      <h2 style={{ color: "#284342" }}>{value}</h2>
    </div>
  );
}