import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { EmptyState } from '../../components/ui/EmptyState';

interface CourseCategory {
  id: string;
  name: string;
  description: string;
  courseCount: number;
  color: string;
}

export default function CourseCategories() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const confirmDialog = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#284342',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);

    const { data, error } = await supabase
      .from('course_categories')
      .select('*');

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const { data: courseRows, error: courseError } = await supabase
      .from('courses')
      .select('category_id');

    if (courseError) {
      console.error(courseError);
    }

    const countByCategory = new Map<string, number>();
    (courseRows || []).forEach((row: any) => {
      if (!row.category_id) return;
      countByCategory.set(
        row.category_id,
        (countByCategory.get(row.category_id) || 0) + 1
      );
    });

    const mapped = (data || []).map((category: any) => ({
      id: category.id,
      name: category.category_name,
      description: category.description || '-',
      courseCount: countByCategory.get(category.id) || 0,
      color: category.color || '#284342',
    }));

    setCategories(mapped);
    setLoading(false);
  }

  function openAddModal() {
    setEditingId(null);
    setFormData({ name: '', description: '', color: '#284342' });
    setShowModal(true);
  }

  function openEditModal(category: CourseCategory) {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description === '-' ? '' : category.description,
      color: category.color,
    });
    setShowModal(true);
  }

  async function saveCategory() {
    if (!formData.name.trim()) {
      alert(t('courses.categories.error.nameRequired'));
      return;
    }

    const payload = {
      category_name: formData.name,
      description: formData.description,
      color: formData.color,
      status: 'active',
    };

    const { error } = editingId
      ? await supabase
          .from('course_categories')
          .update(payload)
          .eq('id', editingId)
      : await supabase.from('course_categories').insert(payload);

    if (error) {
      alert(t('courses.categories.error.saveFailed', { error: error.message }));
      return;
    }

    setFormData({
      name: '',
      description: '',
      color: '#284342',
    });

    setEditingId(null);
    setShowModal(false);
    fetchCategories();
  }

  async function deleteCategory(id: string) {
    const confirmDelete = await confirmDialog(t('courses.categories.confirmDelete'), {
      variant: 'danger',
      confirmLabel: t('common.delete'),
    });

    if (!confirmDelete) return;

    const { error } = await supabase
      .from('course_categories')
      .delete()
      .eq('id', id);

    if (error) {
      alert(t('courses.categories.error.deleteFailed', { error: error.message }));
      return;
    }

    fetchCategories();
  }

  const totalCourses = categories.reduce(
    (sum, category) => sum + category.courseCount,
    0
  );

  const averageCourses =
    categories.length > 0 ? Math.round(totalCourses / categories.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('courses.categories.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('courses.categories.subtitle')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          {t('courses.categories.addCategory')}
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('courses.categories.loading')}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <EmptyState
          icon={<BookOpen size={22} />}
          message={t('courses.categories.empty')}
          hint={t('courses.categories.emptyHint')}
          actionLabel={t('courses.categories.addCategory')}
          onAction={openAddModal}
        />
      )}

      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <BookOpen size={24} style={{ color: category.color }} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                  >
                    <Edit size={16} className="text-[#284342]" />
                  </button>

                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg text-[#284342] mb-2">
                {category.name}
              </h3>

              <p className="text-sm text-[#6b6b6b] mb-4">
                {category.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <div>
                  <p className="text-sm text-[#6b6b6b]">{t('courses.categories.courses')}</p>
                  <p className="text-xl text-[#284342]">
                    {category.courseCount}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/app/courses/list')}
                  className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                >
                  {t('courses.categories.viewCourses')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-xl text-[#284342] mb-4">{t('courses.categories.statisticsTitle')}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={categories.length} label={t('courses.categories.stat.totalCategories')} />
          <StatCard value={totalCourses} label={t('courses.categories.stat.totalCourses')} />
          <StatCard value={averageCourses} label={t('courses.categories.stat.avgCourses')} />
          <StatCard value={148} label={t('courses.categories.stat.activeStudents')} />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              {editingId ? t('courses.categories.modal.editTitle') : t('courses.categories.modal.addTitle')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.categories.field.name')}
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
                  placeholder={t('courses.categories.field.namePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.categories.field.description')}
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
                  placeholder={t('courses.categories.field.descriptionPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('courses.categories.field.colorTheme')}
                </label>

                <div className="flex gap-3">
                  {['#284342', '#6b8e8d', '#1a2f2e', '#e9da95'].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            color,
                          }))
                        }
                        className={`w-12 h-12 rounded-lg border-2 ${
                          formData.color === color
                            ? 'border-[#284342]'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
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
                {t('courses.categories.cancel')}
              </button>

              <button
                onClick={saveCategory}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {editingId ? t('courses.categories.saveChanges') : t('courses.categories.createCategory')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
      <p className="text-3xl text-[#284342] mb-2">{value}</p>
      <p className="text-sm text-[#6b6b6b]">{label}</p>
    </div>
  );
}
