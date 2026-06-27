import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Search,
  Filter,
  Eye,
  FileText,
  CheckCircle2,
  PauseCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';

interface Student {
  id: string;
  userId: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Inactive' | 'Suspended';
  progress: number;
  joinDate: string;
}

export default function StudentList() {
  const currentUser = getCurrentUser();

  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const canManageStudents =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin';

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        user_id,
        student_code,
        full_name,
        email,
        phone,
        status,
        progress,
        enroll_date,
        created_at,
        enrollments(
          enrollment_status,
          class_batches(
            batch_name,
            courses(course_name)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error.message);
      setLoading(false);
      return;
    }

    const mappedStudents: Student[] = (data || []).map((student: any) => {
      const activeEnrollment =
        (student.enrollments || []).find(
          (item: any) => item.enrollment_status === 'active'
        ) || getSingle(student.enrollments);

      const batch = getSingle(activeEnrollment?.class_batches);
      const course = getSingle(batch?.courses);

      return {
        id: student.id,
        userId: student.user_id || '',
        studentCode: student.student_code || '-',
        name: student.full_name || student.student_code || 'Unnamed Student',
        email: student.email || '-',
        phone: student.phone || '-',
        course: course?.course_name || '-',
        batch: batch?.batch_name || '-',
        status: mapStudentStatus(student.status),
        progress: Number(student.progress || 0),
        joinDate: student.enroll_date || student.created_at?.slice(0, 10) || '-',
      };
    });

    setStudents(mappedStudents);
    setLoading(false);
  }

  async function updateStudentStatus(student: Student, newStatus: string) {
    if (!canManageStudents) return;

    const confirmed = confirm(`Update ${student.name} status to ${formatStatusLabel(newStatus)}?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('students')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', student.id);

    if (error) {
      alert(`Failed to update student: ${error.message}`);
      return;
    }

    if (student.userId) {
      const userStatus =
        newStatus === 'active'
          ? 'active'
          : newStatus === 'suspended'
          ? 'inactive'
          : 'active';

      await supabase
        .from('users')
        .update({
          status: userStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', student.userId);
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Student Status Updated',
      module: 'Student Management',
      target_id: student.id,
      old_data: { status: student.status },
      new_data: {
        status: newStatus,
        student_name: student.name,
        updated_by: currentUser.email,
        role: currentUser.role,
      },
      created_at: new Date().toISOString(),
    });

    fetchStudents();
  }

  const courses = [
    'All',
    ...Array.from(
      new Set(students.map((student) => student.course).filter(Boolean))
    ),
  ];

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      student.name.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search) ||
      student.studentCode.toLowerCase().includes(search);

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
    (s) =>
      s.status === 'On Hold' ||
      s.status === 'Inactive' ||
      s.status === 'Suspended'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-[#284342]">Student List</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage all registered students and their enrolment status.
          </p>
        </div>

        {canManageStudents && (
          <Link
            to="/app/students/registration"
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
          >
            Add New Student
          </Link>
        )}
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

          <button
            onClick={fetchStudents}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors flex items-center gap-2"
          >
            <RefreshCw size={20} className="text-[#284342]" />
            <span className="text-[#284342]">Refresh</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[rgba(40,67,66,0.1)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectFilter
                label="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                options={['All', 'Active', 'Completed', 'On Hold', 'Inactive', 'Suspended']}
              />

              <SelectFilter
                label="Course"
                value={filterCourse}
                onChange={setFilterCourse}
                options={courses.map((course) => (course === '-' ? 'No Course' : course))}
                rawOptions={courses}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                  <tr key={student.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {student.studentCode}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-[#284342]">{student.name}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        Joined {student.joinDate}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-[#6b6b6b]">{student.email}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">{student.phone}</p>
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

                        <Link
                          to="/app/documents"
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Documents"
                        >
                          <FileText size={16} className="text-[#284342]" />
                        </Link>

                        {canManageStudents && student.status !== 'Completed' && (
                          <button
                            onClick={() => updateStudentStatus(student, 'completed')}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={16} className="text-blue-700" />
                          </button>
                        )}

                        {canManageStudents &&
                          student.status !== 'On Hold' &&
                          student.status !== 'Inactive' && (
                            <button
                              onClick={() => updateStudentStatus(student, 'inactive')}
                              className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                              title="Put On Hold"
                            >
                              <PauseCircle size={16} className="text-yellow-700" />
                            </button>
                          )}

                        {canManageStudents && student.status !== 'Active' && (
                          <button
                            onClick={() => updateStudentStatus(student, 'active')}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Activate"
                          >
                            <CheckCircle2 size={16} className="text-green-700" />
                          </button>
                        )}

                        {canManageStudents && student.status !== 'Suspended' && (
                          <button
                            onClick={() => updateStudentStatus(student, 'suspended')}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Suspend"
                          >
                            <XCircle size={16} className="text-red-700" />
                          </button>
                        )}
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

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  rawOptions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  rawOptions?: string[];
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(rawOptions ? rawOptions[e.target.selectedIndex] : e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
      >
        {options.map((option, index) => (
          <option key={`${option}-${index}`} value={rawOptions ? rawOptions[index] : option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-sm text-[#284342]">
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: Student['status'] }) {
  const className =
    status === 'Active'
      ? 'bg-green-100 text-green-700'
      : status === 'Completed'
      ? 'bg-blue-100 text-blue-700'
      : status === 'Suspended'
      ? 'bg-red-100 text-red-700'
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
  if (status === 'suspended') return 'Suspended';
  return 'On Hold';
}

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}