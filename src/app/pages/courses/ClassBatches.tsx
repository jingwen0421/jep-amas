import { Plus, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../../components/ui/EmptyState';

interface Batch {
  id: string;
  name: string;
  course: string;
  courseId: string | null;
  startDate: string;
  endDate: string;
  students: number;
  capacity: number;
  schedule: string;
  teacher: string;
  status: 'Active' | 'Upcoming' | 'Completed';
}

interface CourseOption {
  id: string;
  course_name: string;
}

export default function ClassBatches() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [batchStudents, setBatchStudents] = useState<
    { id: string; full_name: string; email: string | null }[]
  >([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    batchName: '',
    startDate: '',
    endDate: '',
    capacity: '',
    schedule: '',
    leadTeacher: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchCourses();
  }, []);

  // Deep-link support: Courses page's "Create Batch" action lands here with
  // ?courseId=... instead of making the admin re-select the course by name.
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    if (!courseId) return;

    openAddModal();
    setFormData((prev) => ({ ...prev, courseId }));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('courseId');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_name')
      .order('course_name', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error.message);
      return;
    }

    setCourses(data || []);
  }

  async function fetchBatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from('class_batches')
      .select(`
        id,
        batch_name,
        start_date,
        end_date,
        capacity,
        schedule,
        lead_teacher,
        status,
        course_id,
        courses(course_name),
        enrollments(id)
      `)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching batches:', error.message);
      setLoading(false);
      return;
    }

    const mapped: Batch[] = (data || []).map((batch: any) => {
      const today = new Date().toISOString().slice(0, 10);

      let status: Batch['status'] =
        batch.status === 'inactive' ? 'Completed' : 'Active';

      if (batch.start_date && batch.start_date > today) {
        status = 'Upcoming';
      }

      return {
        id: batch.id,
        name: batch.batch_name || '-',
        course: batch.courses?.course_name || '-',
        courseId: batch.course_id || null,
        startDate: batch.start_date || '-',
        endDate: batch.end_date || '-',
        students: batch.enrollments?.length || 0,
        capacity: batch.capacity || 0,
        schedule: batch.schedule || '-',
        teacher: batch.lead_teacher || '-',
        status,
      };
    });

    setBatches(mapped);
    setLoading(false);
  }

  function openAddModal() {
    setEditingId(null);
    setFormData({
      courseId: '',
      batchName: '',
      startDate: '',
      endDate: '',
      capacity: '',
      schedule: '',
      leadTeacher: '',
    });
    setShowModal(true);
  }

  function openEditModal(batch: Batch) {
    setEditingId(batch.id);
    setFormData({
      courseId: batch.courseId || '',
      batchName: batch.name === '-' ? '' : batch.name,
      startDate: batch.startDate === '-' ? '' : batch.startDate,
      endDate: batch.endDate === '-' ? '' : batch.endDate,
      capacity: String(batch.capacity),
      schedule: batch.schedule === '-' ? '' : batch.schedule,
      leadTeacher: batch.teacher === '-' ? '' : batch.teacher,
    });
    setShowModal(true);
  }

  async function openViewStudents(batch: Batch) {
    setViewingBatch(batch);
    setLoadingStudents(true);

    const { data, error } = await supabase
      .from('enrollments')
      .select('students(id, full_name, email)')
      .eq('batch_id', batch.id);

    if (error) {
      console.error('Error fetching batch students:', error.message);
      setBatchStudents([]);
      setLoadingStudents(false);
      return;
    }

    setBatchStudents(
      (data || [])
        .map((row: any) => row.students)
        .filter((s: any) => !!s)
    );
    setLoadingStudents(false);
  }

  async function saveBatch() {
    if (!formData.courseId || !formData.batchName || !formData.capacity) {
      alert(t('courses.batches.error.requiredFields'));
      return;
    }

    const payload = {
      course_id: formData.courseId,
      batch_name: formData.batchName,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      capacity: Number(formData.capacity),
      schedule: formData.schedule,
      lead_teacher: formData.leadTeacher,
      status: 'active',
    };

    const { error } = editingId
      ? await supabase.from('class_batches').update(payload).eq('id', editingId)
      : await supabase.from('class_batches').insert(payload);

    if (error) {
      alert(t('courses.batches.error.saveFailed', { error: error.message }));
      return;
    }

    setFormData({
      courseId: '',
      batchName: '',
      startDate: '',
      endDate: '',
      capacity: '',
      schedule: '',
      leadTeacher: '',
    });

    setEditingId(null);
    setShowModal(false);
    fetchBatches();
  }

  function statusLabel(status: Batch['status']) {
    if (status === 'Active') return t('courses.batches.status.active');
    if (status === 'Upcoming') return t('courses.batches.status.upcoming');
    return t('courses.batches.status.completed');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('courses.batches.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('courses.batches.subtitle')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          {t('courses.batches.createBatch')}
        </button>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            {t('courses.batches.loading')}
          </div>
        )}

        {!loading && batches.length === 0 && (
          <EmptyState
            icon={<Layers size={22} />}
            message={t('courses.batches.empty')}
            hint={t('courses.batches.emptyHint')}
            actionLabel={t('courses.batches.createBatch')}
            onAction={openAddModal}
          />
        )}

        {!loading &&
          batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl text-[#284342]">{batch.name}</h3>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        batch.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : batch.status === 'Upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabel(batch.status)}
                    </span>
                  </div>

                  <p className="text-sm text-[#6b6b6b]">{batch.course}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-[#6b6b6b] mb-1">{t('courses.batches.capacity')}</p>
                  <p className="text-2xl text-[#284342]">
                    {batch.students}/{batch.capacity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Info label={t('courses.batches.info.startDate')} value={batch.startDate} />
                <Info label={t('courses.batches.info.endDate')} value={batch.endDate} />
                <Info label={t('courses.batches.info.schedule')} value={batch.schedule} />
                <Info label={t('courses.batches.info.leadTeacher')} value={batch.teacher} />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <button
                  onClick={() => openViewStudents(batch)}
                  className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                >
                  {t('courses.batches.viewStudents')}
                </button>

                <button
                  onClick={() => openEditModal(batch)}
                  className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                >
                  {t('courses.batches.editBatch')}
                </button>

                <button
                  onClick={() => navigate('/app/classes/scheduling')}
                  className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                >
                  {t('courses.batches.schedule')}
                </button>
              </div>
            </div>
          ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              {editingId ? t('courses.batches.modal.editTitle') : t('courses.batches.modal.createTitle')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.batches.field.course')}
                </label>

                <select
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courseId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="">{t('courses.batches.field.selectCourse')}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.batches.field.batchName')}
                </label>

                <input
                  value={formData.batchName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      batchName: e.target.value,
                    }))
                  }
                  placeholder={t('courses.batches.field.batchNamePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('courses.batches.field.startDate')}
                  type="date"
                  value={formData.startDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startDate: value }))
                  }
                />

                <Input
                  label={t('courses.batches.field.endDate')}
                  type="date"
                  value={formData.endDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, endDate: value }))
                  }
                />
              </div>

              <Input
                label={t('courses.batches.field.capacity')}
                type="number"
                value={formData.capacity}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, capacity: value }))
                }
              />

              <Input
                label={t('courses.batches.field.schedule')}
                value={formData.schedule}
                placeholder={t('courses.batches.field.schedulePlaceholder')}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, schedule: value }))
                }
              />

              <Input
                label={t('courses.batches.field.leadTeacher')}
                value={formData.leadTeacher}
                placeholder={t('courses.batches.field.leadTeacherPlaceholder')}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, leadTeacher: value }))
                }
              />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('courses.batches.cancel')}
              </button>

              <button
                onClick={saveBatch}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {editingId ? t('courses.batches.saveChanges') : t('courses.batches.createBatchButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl text-[#284342] mb-1">
              {viewingBatch.name}
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-6">
              {viewingBatch.course}
            </p>

            {loadingStudents && (
              <p className="text-sm text-[#6b6b6b]">{t('courses.batches.studentsModal.loading')}</p>
            )}

            {!loadingStudents && batchStudents.length === 0 && (
              <p className="text-sm text-[#6b6b6b]">
                {t('courses.batches.studentsModal.empty')}
              </p>
            )}

            {!loadingStudents && batchStudents.length > 0 && (
              <div className="space-y-2">
                {batchStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 rounded-lg bg-[#f8f8f6] flex items-center justify-between"
                  >
                    <span className="text-sm text-[#284342]">
                      {student.full_name}
                    </span>
                    <span className="text-xs text-[#6b6b6b]">
                      {student.email || '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setViewingBatch(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('courses.batches.studentsModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
      />
    </div>
  );
}
