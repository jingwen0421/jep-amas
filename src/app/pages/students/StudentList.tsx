import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Search,
  Filter,
  Eye,
  Edit,
  FileText,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Inactive';
  progress: number;
  joinDate: string;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error.message);
      setLoading(false);
      return;
    }

    const mappedStudents: Student[] = (data || []).map((student: any) => ({
      id: student.id,
      studentCode: student.student_code || '-',
      name: student.full_name || student.student_code || 'Unnamed Student',
      email: student.email || '-',
      phone: student.phone || '-',
      course: student.course || '-',
      batch: student.batch || '-',
      status: mapStudentStatus(student.status),
      progress: student.progress || 0,
      joinDate: student.enroll_date || student.created_at?.slice(0, 10) || '-',
    }));

    setStudents(mappedStudents);
    setLoading(false);
  }

  async function updateStudentStatus(student: Student, newStatus: string) {
    const { error } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', student.id);

    if (error) {
      alert(`Failed to update student: ${error.message}`);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Student Status Updated',
      module: 'Student Management',
      target_id: student.id,
      old_data: { status: student.status },
      new_data: { status: newStatus, student_name: student.name },
      created_at: new Date().toISOString(),
    });

    fetchStudents();
  }

  const courses = [
    'All',
    ...Array.from(new Set(students.map((student) => student.course).filter(Boolean))),
  ];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' || student.status === filterStatus;

    const matchesCourse =
      filterCourse === 'All' || student.course === filterCourse;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'Active').length;
  const completedStudents = students.filter((s) => s.status === 'Completed').length;
  const onHoldStudents = students.filter(
    (s) => s.status === 'On Hold' || s.status === 'Inactive'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Student List</h1>
          <p className="text-[#6b6b6b] mt-1">Manage all registered students</p>
        </div>

        <Link
          to="/app/students/registration"
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          Add New Student
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Students" value={totalStudents} color="text-[#284342]" />
        <SummaryCard label="Active" value={activeStudents} color="text-green-700" />
        <SummaryCard label="Completed" value={completedStudents} color="text-blue-700" />
        <SummaryCard label="On Hold / Inactive" value={onHoldStudents} color="text-yellow-700" />
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b6b6b]"
              size={20}
            />

            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors flex items-center gap-2"
          >
            <Filter size={20} className="text-[#284342]" />
            <span className="text-[#284342]">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[rgba(40,67,66,0.1)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Status
                </label>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Course
                </label>

                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course === '-' ? 'No Course' : course}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Student ID</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Name</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Contact</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Batch</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Progress</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#6b6b6b]">
                    Loading students...
                  </td>
                </tr>
              )}

              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#6b6b6b]">
                    No students found.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-[#f8f8f6] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {student.studentCode}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-[#284342]">{student.name}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">
                          Joined {student.joinDate}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-[#6b6b6b]">{student.email}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">{student.phone}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {student.course}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {student.batch}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#e8e7e2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#284342] rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#6b6b6b] w-12">
                          {student.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={student.status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/app/students/profile/${student.id}`}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </Link>

                        <button
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Edit"
                          onClick={() => alert('Edit student will be added in Student Profile page.')}
                        >
                          <Edit size={16} className="text-[#284342]" />
                        </button>

                        <Link
                          to="/app/documents"
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Documents"
                        >
                          <FileText size={16} className="text-[#284342]" />
                        </Link>

                        {student.status !== 'Completed' && (
                          <button
                            onClick={() => updateStudentStatus(student, 'completed')}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={16} className="text-green-700" />
                          </button>
                        )}

                        {student.status !== 'On Hold' && student.status !== 'Inactive' && (
                          <button
                            onClick={() => updateStudentStatus(student, 'inactive')}
                            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                            title="Put On Hold"
                          >
                            <PauseCircle size={16} className="text-yellow-700" />
                          </button>
                        )}

                        {student.status !== 'Active' && (
                          <button
                            onClick={() => updateStudentStatus(student, 'active')}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Activate"
                          >
                            <CheckCircle2 size={16} className="text-green-700" />
                          </button>
                        )}

                        <button
                          onClick={() => updateStudentStatus(student, 'suspended')}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Suspend"
                        >
                          <XCircle size={16} className="text-red-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <p className="text-sm text-[#6b6b6b]">
            Showing {filteredStudents.length} of {students.length} students
          </p>

          <p className="text-xs text-[#6b6b6b]">
            Pagination can be added after final data volume is confirmed.
          </p>
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
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Student['status'] }) {
  const className =
    status === 'Active'
      ? 'bg-green-100 text-green-700'
      : status === 'Completed'
      ? 'bg-blue-100 text-blue-700'
      : status === 'Inactive'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs ${className}`}>
      {status}
    </span>
  );
}

function mapStudentStatus(status: string): Student['status'] {
  if (status === 'active') return 'Active';
  if (status === 'completed') return 'Completed';
  if (status === 'inactive') return 'Inactive';
  return 'On Hold';
}