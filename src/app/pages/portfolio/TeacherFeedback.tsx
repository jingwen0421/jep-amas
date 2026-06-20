import { useEffect, useState } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
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
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionReview | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    submission: SubmissionReview;
    status: 'approved' | 'revision_required';
  } | null>(null);

  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

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
        lessons(
          lesson_title,
          class_batches(
            courses(course_name)
          )
        ),
        portfolio_feedback(
          id,
          score,
          feedback
        )
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error.message);
      setLoading(false);
      return;
    }

    const mapped: SubmissionReview[] = (data || []).map((item: any) => {
      const feedbackRow = getSingle(item.portfolio_feedback);

      return {
        id: item.id,
        student: getStudentName(item.students),
        assignment: item.title || '-',
        course: getCourseName(item.lessons, item.description),
        submittedDate: item.submitted_at
          ? new Date(item.submitted_at).toISOString().slice(0, 10)
          : '-',
        status: mapStatus(item.portfolio_status),
        score: feedbackRow?.score,
        feedback: feedbackRow?.feedback,
        fileUrl: item.file_url,
      };
    });

    setSubmissions(mapped);
    setLoading(false);
  }

  function openReviewModal(
    submission: SubmissionReview,
    status: 'approved' | 'revision_required'
  ) {
    setReviewModal({ submission, status });
    setScore(submission.score !== undefined ? String(submission.score) : status === 'approved' ? '90' : '70');
    setFeedback(submission.feedback || '');
  }

  async function saveReview() {
    if (!reviewModal) return;

    const numericScore = Number(score);

    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      alert('Please enter a valid score between 0 and 100.');
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let teacherId: string | null = null;

    if (user?.id) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      teacherId = teacher?.id || null;
    }

    if (!teacherId) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .limit(1)
        .maybeSingle();

      teacherId = teacher?.id || null;
    }

    const { error: updateError } = await supabase
      .from('portfolio_items')
      .update({
        portfolio_status: reviewModal.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewModal.submission.id);

    if (updateError) {
      setSaving(false);
      alert(`Failed to update submission: ${updateError.message}`);
      return;
    }

    const { data: existingFeedback } = await supabase
      .from('portfolio_feedback')
      .select('id')
      .eq('portfolio_item_id', reviewModal.submission.id)
      .maybeSingle();

    if (existingFeedback) {
      const { error: feedbackError } = await supabase
        .from('portfolio_feedback')
        .update({
          teacher_id: teacherId,
          score: numericScore,
          feedback,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', existingFeedback.id);

      if (feedbackError) {
        setSaving(false);
        alert(`Submission updated, but feedback update failed: ${feedbackError.message}`);
        return;
      }
    } else {
      const { error: feedbackError } = await supabase
        .from('portfolio_feedback')
        .insert({
          portfolio_item_id: reviewModal.submission.id,
          teacher_id: teacherId,
          score: numericScore,
          feedback,
          reviewed_at: new Date().toISOString(),
        });

      if (feedbackError) {
        setSaving(false);
        alert(`Submission updated, but feedback failed: ${feedbackError.message}`);
        return;
      }
    }

    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action:
        reviewModal.status === 'approved'
          ? 'Portfolio Approved'
          : 'Portfolio Revision Requested',
      module: 'Portfolio',
      target_id: reviewModal.submission.id,
      old_data: {
        previous_status: reviewModal.submission.status,
      },
      new_data: {
        student: reviewModal.submission.student,
        assignment: reviewModal.submission.assignment,
        score: numericScore,
        feedback,
      },
      created_at: new Date().toISOString(),
    });

    setSaving(false);
    setReviewModal(null);
    setScore('');
    setFeedback('');
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
          Review student portfolio submissions and provide feedback
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
                <div className="flex flex-col lg:flex-row gap-5">
                  <SubmissionPreview fileUrl={submission.fileUrl} />

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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

                    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[rgba(40,67,66,0.1)] flex-wrap">
                      {submission.status === 'Pending Review' ? (
                        <>
                          <button
                            onClick={() => openReviewModal(submission, 'approved')}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              openReviewModal(submission, 'revision_required')
                            }
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                          >
                            <AlertCircle size={16} />
                            Request Revision
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openReviewModal(submission, 'approved')}
                          className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                        >
                          Edit Feedback
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Preview Submission
                      </button>

                      {submission.fileUrl && (
                        <button
                          onClick={() => window.open(submission.fileUrl, '_blank')}
                          className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                        >
                          Open File
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {selectedSubmission && (
        <PreviewModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}

      {reviewModal && (
        <ReviewModal
          submission={reviewModal.submission}
          status={reviewModal.status}
          score={score}
          feedback={feedback}
          saving={saving}
          setScore={setScore}
          setFeedback={setFeedback}
          onClose={() => setReviewModal(null)}
          onSave={saveReview}
        />
      )}
    </div>
  );
}

function SubmissionPreview({ fileUrl }: { fileUrl?: string }) {
  if (!fileUrl) {
    return (
      <div className="w-full lg:w-44 h-44 rounded-lg bg-[#f8f8f6] border border-[rgba(40,67,66,0.1)] flex items-center justify-center">
        <FileText size={40} className="text-[#6b6b6b]" />
      </div>
    );
  }

  if (isImage(fileUrl)) {
    return (
      <img
        src={fileUrl}
        alt="Submission"
        className="w-full lg:w-44 h-44 object-cover rounded-lg border border-[rgba(40,67,66,0.1)]"
      />
    );
  }

  return (
    <div className="w-full lg:w-44 h-44 rounded-lg bg-[#f8f8f6] border border-[rgba(40,67,66,0.1)] flex flex-col items-center justify-center">
      <FileText size={40} className="text-[#284342] mb-2" />
      <p className="text-xs text-[#6b6b6b]">Document</p>
    </div>
  );
}

function PreviewModal({
  submission,
  onClose,
}: {
  submission: SubmissionReview;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <div>
            <h2 className="text-xl text-[#284342]">{submission.assignment}</h2>
            <p className="text-sm text-[#6b6b6b] mt-1">
              {submission.student} • {submission.course}
            </p>
          </div>

          <button onClick={onClose}>
            <X size={20} className="text-[#284342]" />
          </button>
        </div>

        <div className="p-6">
          {!submission.fileUrl && (
            <div className="h-96 rounded-lg bg-[#f8f8f6] flex items-center justify-center text-[#6b6b6b]">
              No file uploaded.
            </div>
          )}

          {submission.fileUrl && isImage(submission.fileUrl) && (
            <img
              src={submission.fileUrl}
              alt="Submission preview"
              className="w-full max-h-[70vh] object-contain rounded-lg bg-[#f8f8f6]"
            />
          )}

          {submission.fileUrl && !isImage(submission.fileUrl) && (
            <iframe
              src={submission.fileUrl}
              title="Submission preview"
              className="w-full h-[70vh] rounded-lg border border-[rgba(40,67,66,0.1)]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  submission,
  status,
  score,
  feedback,
  saving,
  setScore,
  setFeedback,
  onClose,
  onSave,
}: {
  submission: SubmissionReview;
  status: 'approved' | 'revision_required';
  score: string;
  feedback: string;
  saving: boolean;
  setScore: (value: string) => void;
  setFeedback: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-[#284342]">
            {status === 'approved' ? 'Approve Submission' : 'Request Revision'}
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-[#284342]" />
          </button>
        </div>

        <div className="space-y-4">
          <Info label="Student" value={submission.student} />
          <Info label="Assignment" value={submission.assignment} />

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Feedback
            </label>
            <textarea
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write teacher feedback here..."
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className={`px-6 py-3 rounded-lg text-white transition-colors disabled:opacity-60 ${
              status === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Review'}
          </button>
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

function getCourseName(lesson: any, fallback?: string) {
  if (!lesson) return fallback || '-';

  const actualLesson = getSingle(lesson);
  const batch = getSingle(actualLesson?.class_batches);
  const course = getSingle(batch?.courses);

  return course?.course_name || actualLesson?.lesson_title || fallback || '-';
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  const actualStudent = getSingle(student);
  return actualStudent?.full_name || 'Unnamed Student';
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function isImage(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.webp') ||
    cleanUrl.endsWith('.gif')
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
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}