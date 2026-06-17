import { useEffect, useState } from 'react';
import { Upload, FileText, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  submittedDate?: string;
  status: 'Pending' | 'Submitted' | 'Overdue' | 'Graded';
  score?: number;
  feedback?: string;
  fileUrl?: string;
}

export default function AssignmentSubmission() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    setLoading(true);

    const { data, error } = await supabase
      .from('portfolio_items')
      .select(`
        id,
        title,
        description,
        file_url,
        portfolio_status,
        submitted_at,
        lessons(
          lesson_title,
          lesson_datetime,
          class_batches(
            courses(course_name)
          )
        ),
        portfolio_feedback(
          score,
          feedback
        )
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error.message);
      setLoading(false);
      return;
    }

    const mapped: Assignment[] = (data || []).map((item: any) => {
      const feedback = Array.isArray(item.portfolio_feedback)
        ? item.portfolio_feedback[0]
        : item.portfolio_feedback;

      return {
        id: item.id,
        title: item.title || '-',
        course: getCourseName(item.lessons),
        dueDate: item.lessons?.lesson_datetime
          ? new Date(item.lessons.lesson_datetime).toISOString().slice(0, 10)
          : '-',
        submittedDate: item.submitted_at
          ? new Date(item.submitted_at).toISOString().slice(0, 10)
          : undefined,
        status: mapPortfolioStatus(item.portfolio_status),
        score: feedback?.score,
        feedback: feedback?.feedback,
        fileUrl: item.file_url,
      };
    });

    setAssignments(mapped);
    setLoading(false);
  }

  const total = assignments.length;
  const pending = assignments.filter((a) => a.status === 'Pending').length;
  const submitted = assignments.filter((a) => a.status === 'Submitted').length;
  const graded = assignments.filter((a) => a.status === 'Graded').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Assignment Submission</h1>
        <p className="text-[#6b6b6b] mt-1">
          Submit assignments and track submission status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Assignments" value={total} color="text-[#284342]" />
        <SummaryCard label="Pending" value={pending} color="text-yellow-700" />
        <SummaryCard label="Submitted" value={submitted} color="text-blue-700" />
        <SummaryCard label="Graded" value={graded} color="text-green-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">My Assignments</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading assignments...
            </div>
          )}

          {!loading && assignments.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No assignments found.
            </div>
          )}

          {!loading &&
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`p-6 hover:bg-[#f8f8f6] transition-colors ${
                  assignment.status === 'Overdue' ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-[#284342]" />
                      <h3 className="text-lg text-[#284342]">
                        {assignment.title}
                      </h3>
                      <StatusBadge status={assignment.status} />
                    </div>

                    <p className="text-sm text-[#6b6b6b] mb-3">
                      {assignment.course}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <Info
                        icon={<Calendar size={14} />}
                        label="Due Date"
                        value={assignment.dueDate}
                        color="text-[#284342]"
                      />

                      {assignment.submittedDate && (
                        <Info
                          icon={<CheckCircle2 size={14} />}
                          label="Submitted"
                          value={assignment.submittedDate}
                          color="text-green-700"
                        />
                      )}

                      {assignment.score !== undefined && (
                        <Info
                          icon={<Clock size={14} />}
                          label="Score"
                          value={`${assignment.score}%`}
                          color="text-[#284342]"
                        />
                      )}
                    </div>

                    {assignment.feedback && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-[#6b6b6b] mb-1">
                          Teacher Feedback:
                        </p>
                        <p className="text-sm text-green-700">
                          {assignment.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  {assignment.status === 'Pending' ||
                  assignment.status === 'Overdue' ? (
                    <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm flex items-center gap-2">
                      <Upload size={16} />
                      Submit Assignment
                    </button>
                  ) : (
                    <button
                      onClick={() => window.open(assignment.fileUrl, '_blank')}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                    >
                      View Submission
                    </button>
                  )}

                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function mapPortfolioStatus(status: string): Assignment['status'] {
  if (status === 'reviewed' || status === 'approved') return 'Graded';
  if (status === 'revision_required') return 'Pending';
  return 'Submitted';
}

function getCourseName(lesson: any) {
  if (!lesson) return '-';

  const actualLesson = Array.isArray(lesson) ? lesson[0] : lesson;
  const batch = actualLesson?.class_batches;
  const actualBatch = Array.isArray(batch) ? batch[0] : batch;
  const course = actualBatch?.courses;
  const actualCourse = Array.isArray(course) ? course[0] : course;

  return actualCourse?.course_name || actualLesson?.lesson_title || '-';
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

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const className =
    status === 'Graded'
      ? 'bg-green-100 text-green-700'
      : status === 'Submitted'
      ? 'bg-blue-100 text-blue-700'
      : status === 'Overdue'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}

function Info({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[#6b6b6b] mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={color}>{value}</p>
    </div>
  );
}