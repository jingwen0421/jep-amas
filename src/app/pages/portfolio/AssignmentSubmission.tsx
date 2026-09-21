import { useEffect, useState } from 'react';
import {
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import { syncPortfolioItem } from '../../services/driveSyncService';
import { useLanguage } from '../../context/LanguageContext';

interface Assignment {
  id: string;
  studentId: string;
  student: string;
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
  const currentUser = getCurrentUser();
  const { t } = useLanguage();

  const isStudentView = currentUser.role === 'student';
  const isAssistantTeacher = currentUser.role === 'assistant_teacher';

  const canSubmitPortfolio =
    currentUser.role === 'student' ||
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'teacher';

  const canSelectStudent =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'teacher';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentProfileFound, setStudentProfileFound] = useState(true);

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
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        setStudentProfileFound(false);
      } else {
        setFormData((prev) => ({
          ...prev,
          studentId,
        }));
      }
    } else {
      await fetchStudents();
    }

    await fetchLessons();
    await fetchAssignments();

    setLoading(false);
  }

  async function fetchAssignments() {
    const currentStudentId =
      isStudentView ? await getCurrentStudentId() : '';

    if (isStudentView && !currentStudentId) {
      setAssignments([]);
      return;
    }

    let query = supabase
      .from('portfolio_items')
      .select(`
        id,
        student_id,
        title,
        description,
        file_url,
        portfolio_status,
        submitted_at,
        students(full_name, email),
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

    if (isStudentView) {
      query = query.eq('student_id', currentStudentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assignments:', error.message);
      return;
    }

    const mapped: Assignment[] = (data || []).map((item: any) => {
      const feedback = getSingle(item.portfolio_feedback);

      return {
        id: item.id,
        studentId: item.student_id || '',
        student: getStudentName(item.students, t),
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
  }

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name')
      .order('full_name');

    if (error) {
      console.error('Error fetching students:', error.message);
      return;
    }

    setStudents(data || []);
  }

  async function fetchLessons() {
    const { data, error } = await supabase
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

    if (error) {
      console.error('Error fetching lessons:', error.message);
      return;
    }

    setLessons((data || []) as LessonOption[]);
  }

  async function openSubmitModal() {
    if (!canSubmitPortfolio) return;

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        alert(t('portfolio.submission.profileNotFound'));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        studentId,
      }));
    }

    setShowModal(true);
  }

  async function submitAssignment() {
    let finalStudentId = formData.studentId;

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        alert(t('portfolio.submission.profileNotFound'));
        return;
      }

      finalStudentId = studentId;
    }

    if (!finalStudentId || !formData.lessonId || !formData.title || !file) {
      alert(t('portfolio.submission.errorMissingFields'));
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const safeTitle = formData.title.replace(/[^a-zA-Z0-9-_]/g, '-');
    const filePath = `${finalStudentId}/${Date.now()}-${safeTitle}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-submissions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      setUploading(false);
      alert(t('portfolio.submission.errorUploadFailed', { message: uploadError.message }));
      return;
    }

    const { data: urlData } = supabase.storage
      .from('portfolio-submissions')
      .getPublicUrl(filePath);

    const { data: insertedItem, error: insertError } = await supabase
      .from('portfolio_items')
      .insert({
        student_id: finalStudentId,
        lesson_id: formData.lessonId,
        title: formData.title,
        description: formData.description,
        file_url: urlData.publicUrl,
        portfolio_status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      setUploading(false);
      alert(t('portfolio.submission.errorSaveFailed', { message: insertError.message }));
      return;
    }

    if (insertedItem) {
      syncPortfolioItem(insertedItem.id).catch((e) => console.error('Drive sync failed:', e));
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Portfolio Submitted',
      module: 'Portfolio',
      target_id: finalStudentId,
      old_data: null,
      new_data: {
        title: formData.title,
        student_id: finalStudentId,
        lesson_id: formData.lessonId,
        submitted_by: currentUser.email,
        role: currentUser.role,
      },
      created_at: new Date().toISOString(),
    });

    setUploading(false);
    setShowModal(false);
    setFile(null);
    setFormData({
      studentId: isStudentView ? finalStudentId : '',
      lessonId: '',
      title: '',
      description: '',
    });

    await fetchAssignments();

    alert(
      isStudentView
        ? t('portfolio.submission.uploadedStudent')
        : t('portfolio.submission.uploaded')
    );
  }

  const total = assignments.length;
  const pending = assignments.filter((a) => a.status === 'Pending').length;
  const submitted = assignments.filter((a) => a.status === 'Submitted').length;
  const graded = assignments.filter((a) => a.status === 'Graded').length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
        {t('portfolio.submission.loading')}
      </div>
    );
  }

  if (isStudentView && !studentProfileFound) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('portfolio.submission.titleStudent')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('portfolio.submission.subtitleStudentSimple')}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          {t('portfolio.submission.profileNotFoundLong')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            {isStudentView ? t('portfolio.submission.titleStudent') : t('portfolio.submission.title')}
          </h1>
          <p className="text-[#6b6b6b] mt-1">
            {isStudentView
              ? t('portfolio.submission.subtitleStudent')
              : isAssistantTeacher
              ? t('portfolio.submission.subtitleAssistant')
              : t('portfolio.submission.subtitle')}
          </p>
        </div>

        {canSubmitPortfolio && !isAssistantTeacher && (
          <button
            onClick={openSubmitModal}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Upload size={18} />
            {isStudentView ? t('portfolio.submission.uploadWork') : t('portfolio.submission.submitPortfolio')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          label={isStudentView ? t('portfolio.submission.mySubmissions') : t('portfolio.submission.totalSubmissions')}
          value={total}
          color="text-[#284342]"
        />
        <SummaryCard label={t('common.pending')} value={pending} color="text-yellow-700" />
        <SummaryCard label={t('portfolio.submission.submitted')} value={submitted} color="text-blue-700" />
        <SummaryCard label={t('portfolio.feedback.reviewed')} value={graded} color="text-green-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            {isStudentView ? t('portfolio.submission.mySubmissions') : t('portfolio.feedback.studentSubmissions')}
          </h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {assignments.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('portfolio.submission.empty')}
            </div>
          )}

          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-6 hover:bg-[#f8f8f6] transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText size={20} className="text-[#284342]" />
                <h3 className="text-lg text-[#284342]">{assignment.title}</h3>
                <StatusBadge status={assignment.status} t={t} />
              </div>

              {!isStudentView && (
                <div className="flex items-center gap-2 text-sm text-[#6b6b6b] mb-2">
                  <User size={14} />
                  {assignment.student}
                </div>
              )}

              <p className="text-sm text-[#6b6b6b] mb-3">{assignment.course}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Info
                  icon={<Calendar size={14} />}
                  label={t('portfolio.submission.lessonDate')}
                  value={assignment.dueDate}
                  color="text-[#284342]"
                />

                {assignment.submittedDate && (
                  <Info
                    icon={<CheckCircle2 size={14} />}
                    label={t('portfolio.feedback.submitted')}
                    value={assignment.submittedDate}
                    color="text-green-700"
                  />
                )}

                {assignment.score !== undefined && (
                  <Info
                    icon={<Clock size={14} />}
                    label={t('portfolio.feedback.score')}
                    value={`${assignment.score}%`}
                    color="text-[#284342]"
                  />
                )}
              </div>

              {assignment.feedback && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-[#6b6b6b] mb-1">
                    {t('portfolio.submission.teacherFeedbackColon')}
                  </p>
                  <p className="text-sm text-green-700">
                    {assignment.feedback}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[rgba(40,67,66,0.1)]">
                {assignment.fileUrl && (
                  <button
                    onClick={() => window.open(assignment.fileUrl, '_blank')}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                  >
                    {t('portfolio.submission.viewSubmission')}
                  </button>
                )}

                {!isStudentView && !isAssistantTeacher && (
                  <span className="text-xs text-[#6b6b6b]">
                    {t('portfolio.submission.handledInFeedbackModule')}
                  </span>
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
              <h2 className="text-xl text-[#284342]">
                {isStudentView ? t('portfolio.submission.uploadModalTitle') : t('portfolio.submission.submitPortfolio')}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="space-y-4">
              {canSelectStudent && (
                <SelectField
                  label={t('portfolio.feedback.student')}
                  value={formData.studentId}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, studentId: value }))
                  }
                  options={students.map((s) => ({
                    value: s.id,
                    label: s.full_name,
                  }))}
                  t={t}
                />
              )}

              {isStudentView && (
                <div className="p-4 rounded-lg bg-[#f8f8f6] flex items-center gap-3">
                  <User size={20} className="text-[#284342]" />
                  <div>
                    <p className="text-sm text-[#284342]">
                      {t('portfolio.submission.uploadingAs', { name: currentUser.name })}
                    </p>
                    <p className="text-xs text-[#6b6b6b]">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
              )}

              <SelectField
                label={t('portfolio.submission.lessonAssignment')}
                value={formData.lessonId}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, lessonId: value }))
                }
                options={lessons.map((lesson) => ({
                  value: lesson.id,
                  label: `${lesson.lesson_title} - ${getCourseName(lesson)}`,
                }))}
                t={t}
              />

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('portfolio.submission.submissionTitle')}
                </label>
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  placeholder={t('portfolio.submission.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.categories.field.description')}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  placeholder={t('portfolio.submission.descriptionPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('portfolio.submission.uploadFile')}
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                />
                <p className="text-xs text-[#6b6b6b] mt-2">
                  {t('portfolio.submission.acceptedFormats')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342]"
              >
                {t('common.cancel')}
              </button>

              <button
                onClick={submitAssignment}
                disabled={uploading}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg disabled:opacity-60"
              >
                {uploading ? t('portfolio.submission.submitting') : t('portfolio.submission.submit')}
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

function getStudentName(student: any, t: (key: string) => string) {
  if (!student) return t('dashboard.fallback.unnamedStudent');
  if (Array.isArray(student)) return student[0]?.full_name || t('dashboard.fallback.unnamedStudent');
  return student.full_name || t('dashboard.fallback.unnamedStudent');
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

function StatusBadge({
  status,
  t,
}: {
  status: Assignment['status'];
  t: (key: string) => string;
}) {
  const className =
    status === 'Graded'
      ? 'bg-green-100 text-green-700'
      : status === 'Submitted'
      ? 'bg-blue-100 text-blue-700'
      : status === 'Overdue'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';

  const label =
    status === 'Graded'
      ? t('portfolio.feedback.reviewed')
      : status === 'Submitted'
      ? t('portfolio.submission.submitted')
      : status === 'Overdue'
      ? t('payments.installments.overdue')
      : t('common.pending');

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {label}
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

function SelectField({
  label,
  value,
  onChange,
  options,
  t,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
      >
        <option value="">{t('portfolio.submission.selectPrefix', { label })}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}