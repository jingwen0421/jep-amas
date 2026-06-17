import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, Clock, Award, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StudentProgressData {
  id: string;
  name: string;
  course: string;
  batch: string;
  overallProgress: number;
  lessonsCompleted: number;
  totalLessons: number;
  attendanceRate: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  averageScore: number;
}

export default function StudentProgress() {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [students, setStudents] = useState<StudentProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student progress:', error.message);
      setLoading(false);
      return;
    }

    const mappedStudents: StudentProgressData[] = (data || []).map((student) => ({
      id: student.student_code || student.id,
      name: student.full_name || 'Unnamed Student',
      course: student.course || '-',
      batch: student.batch || '-',
      overallProgress: student.progress || 0,
      lessonsCompleted: student.lessons_completed || 0,
      totalLessons: student.total_lessons || 24,
      attendanceRate: student.attendance_rate || 0,
      assignmentsCompleted: student.assignments_completed || 0,
      totalAssignments: student.total_assignments || 15,
      averageScore: student.average_score || 0,
    }));

    setStudents(mappedStudents);
    setLoading(false);
  }

  const batches = [
    'All Batches',
    ...Array.from(new Set(students.map((student) => student.batch))).filter(
      (batch) => batch && batch !== '-'
    ),
  ];

  const filteredStudents =
    selectedBatch === 'All Batches'
      ? students
      : students.filter((student) => student.batch === selectedBatch);

  const avgProgress =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => sum + student.overallProgress, 0) /
            students.length
        )
      : 0;

  const avgAttendance =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => sum + student.attendanceRate, 0) /
            students.length
        )
      : 0;

  const avgScore =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => sum + student.averageScore, 0) /
            students.length
        )
      : 0;

  const onTrackCount = students.filter(
    (student) => student.overallProgress >= 70
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            Student Progress Tracking
          </h1>
          <p className="text-[#6b6b6b] mt-1">
            Monitor student course completion and performance
          </p>
        </div>

        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors">
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm text-[#284342]">Filter by Batch:</label>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            {batches.map((batch) => (
              <option key={batch}>{batch}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading student progress...
            </div>
          )}

          {!loading && filteredStudents.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No active students found.
            </div>
          )}

          {!loading &&
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-6 rounded-xl border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg text-[#284342] mb-1">
                      {student.name}
                    </h3>
                    <p className="text-sm text-[#6b6b6b]">
                      {student.course} • {student.batch}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl text-[#284342]">
                      {student.overallProgress}%
                    </p>
                    <p className="text-xs text-[#6b6b6b]">
                      Overall Progress
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#6b6b6b]">
                      Course Completion
                    </span>
                  </div>

                  <div className="w-full h-3 bg-[#e8e7e2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#284342] rounded-full transition-all"
                      style={{ width: `${student.overallProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard
                    icon={<CheckCircle2 size={20} className="text-[#284342]" />}
                    value={`${student.lessonsCompleted}/${student.totalLessons}`}
                    label="Lessons"
                    color="#284342"
                  />

                  <MetricCard
                    icon={<Clock size={20} className="text-green-700" />}
                    value={`${student.attendanceRate}%`}
                    label="Attendance"
                    color="green"
                  />

                  <MetricCard
                    icon={<Target size={20} className="text-blue-700" />}
                    value={`${student.assignmentsCompleted}/${student.totalAssignments}`}
                    label="Assignments"
                    color="blue"
                  />

                  <MetricCard
                    icon={<Award size={20} className="text-purple-700" />}
                    value={`${student.averageScore}%`}
                    label="Avg Score"
                    color="purple"
                  />

                  <div className="text-center p-3 rounded-lg bg-[#f8f8f6]">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp
                        size={20}
                        className={
                          student.overallProgress >= 70
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }
                      />
                    </div>

                    <p
                      className={`text-lg ${
                        student.overallProgress >= 70
                          ? 'text-green-700'
                          : 'text-yellow-700'
                      }`}
                    >
                      {student.overallProgress >= 70
                        ? 'On Track'
                        : 'Needs Support'}
                    </p>

                    <p className="text-xs text-[#6b6b6b]">Status</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
                    View Details
                  </button>

                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    Send Progress Report
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-xl text-[#284342] mb-4">
          Batch Performance Overview
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OverviewCard value={`${avgProgress}%`} label="Avg Progress" color="#284342" />
          <OverviewCard value={`${avgAttendance}%`} label="Avg Attendance" color="green" />
          <OverviewCard value={onTrackCount.toString()} label="On Track" color="blue" />
          <OverviewCard value={`${avgScore}%`} label="Avg Score" color="purple" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-700'
      : color === 'blue'
      ? 'text-blue-700'
      : color === 'purple'
      ? 'text-purple-700'
      : 'text-[#284342]';

  return (
    <div className="text-center p-3 rounded-lg bg-[#f8f8f6]">
      <div className="flex items-center justify-center mb-2">{icon}</div>
      <p className={`text-lg ${colorClass}`}>{value}</p>
      <p className="text-xs text-[#6b6b6b]">{label}</p>
    </div>
  );
}

function OverviewCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-700'
      : color === 'blue'
      ? 'text-blue-700'
      : color === 'purple'
      ? 'text-purple-700'
      : 'text-[#284342]';

  return (
    <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
      <p className={`text-3xl mb-2 ${colorClass}`}>{value}</p>
      <p className="text-sm text-[#6b6b6b]">{label}</p>
    </div>
  );
}