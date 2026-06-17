import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Search, Filter, MoreVertical, Eye, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  status: 'Active' | 'Completed' | 'On Hold';
  progress: number;
  joinDate: string;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      const mappedStudents: Student[] = (data || []).map((student) => ({
        id: student.id,
        studentCode: student.student_code || '-',
        name: student.full_name || student.student_code || 'Unnamed Student',
        email: student.email || '-',
        phone: student.phone || '-',
        course: student.course || '-',
        batch: student.batch || '-',
        status:
          student.status === 'active'
            ? 'Active'
            : student.status === 'completed'
            ? 'Completed'
            : 'On Hold',
        progress: student.progress || 0,
        joinDate:
          student.enroll_date ||
          student.created_at?.slice(0, 10) ||
          '-',
      }));

      setStudents(mappedStudents);
      setLoading(false);
    }

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' || student.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Course
                </label>

                <select className="w-full px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]">
                  <option>All Courses</option>
                  <option>Professional Makeup Artist Course</option>
                  <option>Bridal Makeup Specialist</option>
                  <option>Advanced Airbrush Course</option>
                  <option>Special Effects Makeup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Batch
                </label>

                <select className="w-full px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]">
                  <option>All Batches</option>
                  <option>2026 Batch A</option>
                  <option>2026 Batch B</option>
                  <option>2026 Batch C</option>
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
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs ${
                          student.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : student.status === 'Completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/students/profile/${student.studentCode}`}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </Link>

                        <button
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} className="text-[#284342]" />
                        </button>

                        <button
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="More"
                        >
                          <MoreVertical size={16} className="text-[#284342]" />
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

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              Previous
            </button>

            <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] text-sm">
              1
            </button>

            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              2
            </button>

            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              3
            </button>

            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}