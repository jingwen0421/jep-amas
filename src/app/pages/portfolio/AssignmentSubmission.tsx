import { useEffect, useState } from 'react';
import { Upload, FileText, Calendar, CheckCircle2, Clock, X } from 'lucide-react';
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

interface StudentOption {
  id: string;
  full_name: string;
}

interface LessonOption {
  id: string;
  lesson_title: string;
  lesson_datetime: string;
  class_batches?: any;
}

export default function AssignmentSubmission() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    lessonId: '',
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchAssignments();
    fetchStudents();
    fetchLessons();
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
        portfolio_feedback(score, feedback)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error.message);
      setLoading(false);
      return;
    }

    const mapped: Assignment[] = (data || []).map((item: any) => {
      const feedback = getSingle(item.portfolio_feedback);

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

  async function fetchStudents() {
    const { data } = await supabase
      .from('students')
      .select('id, full_name')
      .order('full_name');

    setStudents(data || []);
  }

  async function fetchLessons() {
    const { data } = await supabase
      .from('lessons')
      .select(`
        id,
        lesson_title,
        lesson_datetime,
        class_batches(
          courses(course_name)
        )
      `)
      .order('lesson_datetime', { ascending: false });

    setLessons((data || []) as LessonOption[]);
  }

  async function submitAssignment() {
    if (!formData.studentId || !formData.lessonId || !formData.title || !file) {
      alert('Please complete all required fields and upload a file.');
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const filePath = `${formData.studentId}/${Date.now()}-${formData.title}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-submissions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      setUploading(false);
      alert(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('portfolio-submissions')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('portfolio_items').insert({
      student_id: formData.studentId,
      lesson_id: formData.lessonId,
      title: formData.title,
      description: formData.description,
      file_url: urlData.publicUrl,
      portfolio_status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      setUploading(false);
      alert(`Failed to save submission: ${insertError.message}`);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Portfolio Submitted',
      module: 'Portfolio',
      target_id: formData.studentId,
      old_data: null,
      new_data: {
        title: formData.title,
        student_id: formData.studentId,
        lesson_id: formData.lessonId,
      },
      created_at: new Date().toISOString(),
    });

    setUploading(false);
    setShowModal(false);
    setFile(null);
    setFormData({
      studentId: '',
      lessonId: '',
      title: '',
      description: '',
    });

    fetchAssignments();
  }

  const total = assignments.length;
  const pending = assignments.filter((a) => a.status === 'Pending').length;
  const submitted = assignments.filter((a) => a.status === 'Submitted').length;
  const graded = assignments.filter((a) => a.status === 'Graded').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Assignment Submission</h1>
          <p className="text-[#6b6b6b] mt-1">
            Submit assignments and track portfolio review status
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Upload size={18} />
          Submit Assignment
        </button>
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
          {loading && <div className="p-6 text-center text-[#6b6b6b]">Loading assignments...</div>}

          {!loading && assignments.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">No assignments found.</div>
          )}

          {!loading &&
            assignments.map((assignment) => (
              <div key={assignment.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={20} className="text-[#284342]" />
                  <h3 className="text-lg text-[#284342]">{assignment.title}</h3>
                  <StatusBadge status={assignment.status} />
                </div>

                <p className="text-sm text-[#6b6b6b] mb-3">{assignment.course}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Info icon={<Calendar size={14} />} label="Due Date" value={assignment.dueDate} color="text-[#284342]" />

                  {assignment.submittedDate && (
                    <Info icon={<CheckCircle2 size={14} />} label="Submitted" value={assignment.submittedDate} color="text-green-700" />
                  )}

                  {assignment.score !== undefined && (
                    <Info icon={<Clock size={14} />} label="Score" value={`${assignment.score}%`} color="text-[#284342]" />
                  )}
                </div>

                {assignment.feedback && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-[#6b6b6b] mb-1">Teacher Feedback:</p>
                    <p className="text-sm text-green-700">{assignment.feedback}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[rgba(40,67,66,0.1)]">
                  {assignment.fileUrl && (
                    <button
                      onClick={() => window.open(assignment.fileUrl, '_blank')}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                    >
                      View Submission
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">Submit Assignment</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="space-y-4">
              <SelectField
                label="Student"
                value={formData.studentId}
                onChange={(value) => setFormData((prev) => ({ ...prev, studentId: value }))}
                options={students.map((s) => ({ value: s.id, label: s.full_name }))}
              />

              <SelectField
                label="Lesson / Assignment"
                value={formData.lessonId}
                onChange={(value) => setFormData((prev) => ({ ...prev, lessonId: value }))}
                options={lessons.map((l) => ({
                  value: l.id,
                  label: `${l.lesson_title} - ${getCourseName(l)}`,
                }))}
              />

              <div>
                <label className="block text-sm text-[#284342] mb-2">Submission Title</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  placeholder="e.g. Bridal Makeup Portfolio"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  placeholder="Short description of submission"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Upload File</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342]"
              >
                Cancel
              </button>

              <button
                onClick={submitAssignment}
                disabled={uploading}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg disabled:opacity-60"
              >
                {uploading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapPortfolioStatus(status: string): Assignment['status'] {
  if (status === 'reviewed' || status === 'approved') return 'Graded';
  if (status === 'revision_required') return 'Pending';
  if (status === 'submitted') return 'Submitted';
  return 'Pending';
}

function getCourseName(lesson: any) {
  if (!lesson) return '-';

  const actualLesson = getSingle(lesson);
  const batch = getSingle(actualLesson?.class_batches);
  const course = getSingle(batch?.courses);

  return course?.course_name || actualLesson?.lesson_title || '-';
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
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

  return <span className={`text-xs px-3 py-1 rounded-full ${className}`}>{status}</span>;
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}