import { Plus, Edit, Trash2, Users, Clock, Layers, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { EmptyState } from '../../components/ui/EmptyState';

interface Course {
  id: string;
  name: string;
  category: string;
  categoryId: string | null;
  duration: string;
  fee: number;
  students: number;
  batches: number;
  status: 'Active' | 'Inactive';
  description: string | null;
  seatReservationAmount: number | null;
  semesterInstallments: number | null;
  monthlyInstallments: number | null;
  feeUnit: string | null;
  remarks: string | null;
  giftDescription: string | null;
}

interface CourseCategory {
  id: string;
  category_name: string;
}

export default function Courses() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const confirmDialog = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    duration: '',
    fee: '',
    description: '',
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('course_categories')
      .select('id, category_name')
      .order('category_name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error.message);
      return;
    }

    setCategories(data || []);
  }

  async function fetchCourses() {
    setLoading(true);

    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        course_name,
        duration,
        course_fee,
        status,
        category_id,
        description,
        seat_reservation_amount,
        semester_installments,
        monthly_installments,
        fee_unit,
        remarks,
        gift_description,
        course_categories(category_name),
        class_batches(id, enrollments(id))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error.message);
      setLoading(false);
      return;
    }

    const mappedCourses: Course[] = (data || []).map((course: any) => ({
      id: course.id,
      name: course.course_name || '-',
      category: course.course_categories?.category_name || '-',
      categoryId: course.category_id || null,
      duration: course.duration || '-',
      fee: Number(course.course_fee || 0),
      batches: course.class_batches?.length || 0,
      students:
        course.class_batches?.reduce(
          (sum: number, batch: any) =>
            sum + (batch.enrollments?.length || 0),
          0
        ) || 0,
      status: course.status === 'active' ? 'Active' : 'Inactive',
      description: course.description || null,
      seatReservationAmount:
        course.seat_reservation_amount !== null &&
        course.seat_reservation_amount !== undefined
          ? Number(course.seat_reservation_amount)
          : null,
      semesterInstallments: course.semester_installments ?? null,
      monthlyInstallments: course.monthly_installments ?? null,
      feeUnit: course.fee_unit || null,
      remarks: course.remarks || null,
      giftDescription: course.gift_description || null,
    }));

    setCourses(mappedCourses);
    setLoading(false);
  }

  function openAddModal() {
    setEditingId(null);
    setFormData({ name: '', categoryId: '', duration: '', fee: '', description: '' });
    setShowModal(true);
  }

  function openEditModal(course: Course) {
    setEditingId(course.id);
    setFormData({
      name: course.name,
      categoryId: course.categoryId || '',
      duration: course.duration === '-' ? '' : course.duration,
      fee: String(course.fee),
      description: course.description || '',
    });
    setShowModal(true);
  }

  async function saveCourse() {
    if (!formData.name || !formData.categoryId || !formData.fee) {
      alert(t('courses.list.error.requiredFields'));
      return;
    }

    const payload = {
      course_name: formData.name,
      category_id: formData.categoryId,
      duration: formData.duration,
      course_fee: Number(formData.fee),
      description: formData.description,
      status: 'active',
    };

    const { error } = editingId
      ? await supabase.from('courses').update(payload).eq('id', editingId)
      : await supabase.from('courses').insert(payload);

    if (error) {
      alert(t('courses.list.error.saveFailed', { error: error.message }));
      return;
    }

    setFormData({
      name: '',
      categoryId: '',
      duration: '',
      fee: '',
      description: '',
    });

    setEditingId(null);
    setShowModal(false);
    fetchCourses();
  }

  async function deleteCourse(course: Course) {
    const confirmed = await confirmDialog(
      t('courses.list.confirmDelete', { name: course.name }),
      { variant: 'danger', confirmLabel: t('common.delete') }
    );

    if (!confirmed) return;

    const { error } = await supabase.from('courses').delete().eq('id', course.id);

    if (error) {
      alert(t('courses.list.error.deleteFailed', { error: error.message }));
      return;
    }

    fetchCourses();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('courses.list.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('courses.list.subtitle')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          {t('courses.list.addCourse')}
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('courses.list.loading')}
        </div>
      )}

      {!loading && courses.length === 0 && (
        <EmptyState
          icon={<BookOpen size={22} />}
          message={t('courses.list.empty')}
          hint={t('courses.list.emptyHint')}
          actionLabel={t('courses.list.addCourse')}
          onAction={openAddModal}
        />
      )}

      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs px-3 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]">
                  {course.category}
                </span>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    course.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {course.status === 'Active' ? t('courses.list.status.active') : t('courses.list.status.inactive')}
                </span>
              </div>

              <h3 className="text-lg text-[#284342] mb-2">
                {course.name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
                  <Clock size={16} />
                  <span>{course.duration}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
                  <Users size={16} />
                  <span>
                    {t('courses.list.studentsInBatches', { students: course.students, batches: course.batches })}
                  </span>
                </div>
              </div>

              <div className="mb-4 pb-4 border-b border-[rgba(40,67,66,0.1)]">
                <p className="text-xs text-[#6b6b6b] mb-1">{t('courses.list.courseFee')}</p>
                <p className="text-2xl text-[#284342]">
                  RM {course.fee.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingCourse(course)}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                >
                  {t('courses.list.viewDetails')}
                </button>

                <button
                  onClick={() => openEditModal(course)}
                  className="p-2 rounded-lg border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors"
                >
                  <Edit size={16} className="text-[#284342]" />
                </button>

                <button
                  onClick={() => navigate(`/app/courses/batches?courseId=${course.id}`)}
                  title={t('courses.list.createBatch')}
                  className="p-2 rounded-lg border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors"
                >
                  <Layers size={16} className="text-[#284342]" />
                </button>

                <button
                  onClick={() => deleteCourse(course)}
                  title={t('common.delete')}
                  className="p-2 rounded-lg border border-[rgba(40,67,66,0.2)] hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              {editingId ? t('courses.list.modal.editTitle') : t('courses.list.modal.addTitle')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.list.field.name')}
                </label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder={t('courses.list.field.namePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    {t('courses.list.field.category')}
                  </label>

                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  >
                    <option value="">{t('courses.list.field.selectCategory')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    {t('courses.list.field.duration')}
                  </label>

                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder={t('courses.list.field.durationPlaceholder')}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.list.field.fee')}
                </label>

                <input
                  type="number"
                  value={formData.fee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fee: e.target.value,
                    }))
                  }
                  placeholder={t('courses.list.field.feePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.list.field.description')}
                </label>

                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={t('courses.list.field.descriptionPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('courses.list.cancel')}
              </button>

              <button
                onClick={saveCourse}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {editingId ? t('courses.list.saveChanges') : t('courses.list.createCourse')}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs px-3 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]">
                  {viewingCourse.category}
                </span>
                <h2 className="text-xl text-[#284342] mt-2">
                  {viewingCourse.name}
                </h2>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  viewingCourse.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {viewingCourse.status === 'Active' ? t('courses.list.status.active') : t('courses.list.status.inactive')}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              {viewingCourse.description && (
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">{t('courses.list.detail.description')}</p>
                  <p className="text-[#284342]">{viewingCourse.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">{t('courses.list.detail.duration')}</p>
                  <p className="text-[#284342]">{viewingCourse.duration}</p>
                </div>

                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">{t('courses.list.detail.courseFee')}</p>
                  <p className="text-[#284342]">
                    RM {viewingCourse.fee.toLocaleString()}
                    {viewingCourse.feeUnit ? ` ${viewingCourse.feeUnit}` : ''}
                  </p>
                </div>

                {viewingCourse.seatReservationAmount !== null && (
                  <div>
                    <p className="text-xs text-[#6b6b6b] mb-1">
                      {t('courses.list.detail.seatReservation')}
                    </p>
                    <p className="text-[#284342]">
                      RM {viewingCourse.seatReservationAmount.toLocaleString()}
                    </p>
                  </div>
                )}

                {(viewingCourse.semesterInstallments ||
                  viewingCourse.monthlyInstallments) && (
                  <div>
                    <p className="text-xs text-[#6b6b6b] mb-1">
                      {t('courses.list.detail.installmentOptions')}
                    </p>
                    <p className="text-[#284342]">
                      {viewingCourse.semesterInstallments
                        ? t('courses.list.detail.semesterSuffix', { count: viewingCourse.semesterInstallments })
                        : ''}
                      {viewingCourse.semesterInstallments &&
                      viewingCourse.monthlyInstallments
                        ? ' / '
                        : ''}
                      {viewingCourse.monthlyInstallments
                        ? t('courses.list.detail.monthlySuffix', { count: viewingCourse.monthlyInstallments })
                        : ''}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">{t('courses.list.detail.enrollment')}</p>
                  <p className="text-[#284342]">
                    {t('courses.list.studentsInBatches', { students: viewingCourse.students, batches: viewingCourse.batches })}
                  </p>
                </div>
              </div>

              {viewingCourse.remarks && (
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">{t('courses.list.detail.remarks')}</p>
                  <p className="text-[#284342]">{viewingCourse.remarks}</p>
                </div>
              )}

              {viewingCourse.giftDescription && (
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">{t('courses.list.detail.giftBonus')}</p>
                  <p className="text-[#284342]">
                    {viewingCourse.giftDescription}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setViewingCourse(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('courses.list.detail.close')}
              </button>

              <button
                onClick={() => {
                  openEditModal(viewingCourse);
                  setViewingCourse(null);
                }}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {t('courses.list.detail.editCourse')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
