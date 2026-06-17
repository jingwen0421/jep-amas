import { useEffect, useState } from 'react';
import { Star, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubmissionReview {
  id: string;
  student: string;
  assignment: string;
  course: string;
  submittedDate: string;
  status: 'Pending Review' | 'Reviewed' | 'Revision Requested';
  score?: number;
  feedback?: string;
  fileUrl?: string;
}

export default function TeacherFeedback() {
  const [submissions, setSubmissions] = useState<SubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);

    const { data, error } = await supabase
      .from('portfolio_items')
      .select(`
        id,
        student_id,
        lesson_id,
        title,
        description,
        file_url,
        portfolio_status,
        submitted_at,
        students(full_name),
        portfolio_feedback(score, feedback)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error.message);
      setLoading(false);
      return;
    }

    const mapped: SubmissionReview[] = (data || []).map((item: any) => {
      const feedback = Array.isArray(item.portfolio_feedback)
        ? item.portfolio_feedback[0]
        : item.portfolio_feedback;

      return {
        id: item.id,
        student: getStudentName(item.students),
        assignment: item.title || '-',
        course: item.description || '-',
        submittedDate: item.submitted_at
          ? new Date(item.submitted_at).toISOString().slice(0, 10)
          : '-',
        status: mapStatus(item.portfolio_status),
        score: feedback?.score,
        feedback: feedback?.feedback,
        fileUrl: item.file_url,
      };
    });

    setSubmissions(mapped);
    setLoading(false);
  }

  async function reviewSubmission(
    id: string,
    status: 'approved' | 'revision_required'
  ) {
    const scoreInput = prompt('Enter score (0-100):', status === 'approved' ? '90' : '70');
    if (scoreInput === null) return;

    const score = Number(scoreInput);

    if (Number.isNaN(score) || score < 0 || score > 100) {
      alert('Please enter a valid score between 0 and 100.');
      return;
    }

    const feedback = prompt('Enter feedback:') || '';

    const { data: teachers } = await supabase
      .from('teachers')
      .select('id')
      .limit(1);

    const teacherId = teachers?.[0]?.id || null;

    const { error: updateError } = await supabase
      .from('portfolio_items')
      .update({ portfolio_status: status })
      .eq('id', id);

    if (updateError) {
      alert(`Failed to update submission: ${updateError.message}`);
      return;
    }

    const { error: feedbackError } = await supabase
      .from('portfolio_feedback')
      .insert({
        portfolio_item_id: id,
        teacher_id: teacherId,
        score,
        feedback,
        reviewed_at: new Date().toISOString(),
      });

    if (feedbackError) {
      alert(`Submission updated, but feedback failed: ${feedbackError.message}`);
      return;
    }

    fetchSubmissions();
  }

  const pendingCount = submissions.filter(
    (s) => s.status === 'Pending Review'
  ).length;

  const reviewedCount = submissions.filter(
    (s) => s.status === 'Reviewed'
  ).length;

  const revisionCount = submissions.filter(
    (s) => s.status === 'Revision Requested'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Teacher Feedback</h1>
        <p className="text-[#6b6b6b] mt-1">
          Review student submissions and provide feedback
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Pending Review" value={pendingCount} color="text-yellow-700" />
        <SummaryCard label="Reviewed" value={reviewedCount} color="text-green-700" />
        <SummaryCard label="Revision Requested" value={revisionCount} color="text-blue-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Student Submissions</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading submissions...
            </div>
          )}

          {!loading && submissions.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No submissions found.
            </div>
          )}

          {!loading &&
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-6 hover:bg-[#f8f8f6] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-[#284342]">
                        {submission.assignment}
                      </h3>
                      <StatusBadge status={submission.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <Info label="Student" value={submission.student} />
                      <Info label="Course" value={submission.course} />
                      <Info label="Submitted" value={submission.submittedDate} />

                      {submission.score !== undefined && (
                        <div>
                          <p className="text-xs text-[#6b6b6b] mb-1">Score</p>
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-[#e9da95] fill-[#e9da95]" />
                            <p className="text-[#284342]">{submission.score}%</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {submission.feedback && (
                      <div className="p-3 bg-[#f8f8f6] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare size={14} className="text-[#284342]" />
                          <p className="text-xs text-[#6b6b6b]">Feedback:</p>
                        </div>
                        <p className="text-sm text-[#284342]">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  {submission.status === 'Pending Review' ? (
                    <>
                      <button
                        onClick={() => reviewSubmission(submission.id, 'approved')}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          reviewSubmission(submission.id, 'revision_required')
                        }
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <AlertCircle size={16} />
                        Request Revision
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => reviewSubmission(submission.id, 'approved')}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                    >
                      Edit Feedback
                    </button>
                  )}

                  <button
                    onClick={() => window.open(submission.fileUrl, '_blank')}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                  >
                    View Submission
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function mapStatus(status: string): SubmissionReview['status'] {
  if (status === 'approved' || status === 'reviewed') return 'Reviewed';
  if (status === 'revision_required') return 'Revision Requested';
  return 'Pending Review';
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
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

function StatusBadge({ status }: { status: SubmissionReview['status'] }) {
  const className =
    status === 'Reviewed'
      ? 'bg-green-100 text-green-700'
      : status === 'Revision Requested'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-[#284342]">{value}</p>
    </div>
  );
}