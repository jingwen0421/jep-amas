// Rebuilt from the old "Lessons" content-management stub (its Add/Edit
// buttons never had handlers, and it was reading the same `lessons` table
// that Class Scheduling uses for actual dated sessions — two different
// concepts sharing one table). This page now manages `course_modules`,
// the real curriculum structure that Class Scheduling schedules sessions
// against and that drives student eligibility tracking.
import { useEffect, useState } from 'react';
import { Plus, GripVertical, CheckCircle2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CourseOption {
  id: string;
  course_name: string;
}

interface ModuleRow {
  id: string;
  title: string;
  description: string | null;
  sequence: number;
  is_required: boolean;
  totalCount: number;
  completedCount: number;
}

const emptyForm = {
  title: '',
  description: '',
  sequence: '',
  isRequired: true,
};

export default function CourseModules() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) fetchModules(selectedCourseId);
  }, [selectedCourseId]);

  async function fetchCourses() {
    setCoursesLoading(true);

    const { data, error } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('status', 'active')
      .order('course_name', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error.message);
      setCoursesLoading(false);
      return;
    }

    setCourses(data || []);
    if (data && data.length > 0) setSelectedCourseId((prev) => prev || data[0].id);
    setCoursesLoading(false);
  }

  async function fetchModules(courseId: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from('course_modules')
      .select('id, title, description, sequence, is_required')
      .eq('course_id', courseId)
      .order('sequence', { ascending: true });

    if (error) {
      console.error('Error fetching modules:', error.message);
      setLoading(false);
      return;
    }

    const moduleRows = data || [];
    const moduleIds = moduleRows.map((row) => row.id);

    let progressByModule: Record<string, { total: number; completed: number }> = {};

    if (moduleIds.length > 0) {
      const { data: progressData, error: progressError } = await supabase
        .from('student_module_progress')
        .select('module_id, status')
        .in('module_id', moduleIds);

      if (progressError) {
        console.error('Error fetching module progress:', progressError.message);
      } else {
        progressByModule = (progressData || []).reduce((acc: any, row: any) => {
          if (!acc[row.module_id]) acc[row.module_id] = { total: 0, completed: 0 };
          acc[row.module_id].total += 1;
          if (row.status === 'completed') acc[row.module_id].completed += 1;
          return acc;
        }, {});
      }
    }

    setModules(
      moduleRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        sequence: row.sequence,
        is_required: row.is_required,
        totalCount: progressByModule[row.id]?.total || 0,
        completedCount: progressByModule[row.id]?.completed || 0,
      }))
    );

    setLoading(false);
  }

  function openAddModal() {
    setEditingModuleId(null);
    setFormError(null);
    setFormData({
      ...emptyForm,
      sequence: String(modules.length + 1),
    });
    setShowModal(true);
  }

  function openEditModal(module: ModuleRow) {
    setEditingModuleId(module.id);
    setFormError(null);
    setFormData({
      title: module.title,
      description: module.description || '',
      sequence: String(module.sequence),
      isRequired: module.is_required,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingModuleId(null);
    setFormError(null);
  }

  async function saveModule() {
    setFormError(null);

    if (!selectedCourseId) {
      setFormError('Select a course first.');
      return;
    }

    if (!formData.title.trim()) {
      setFormError('Module title is required.');
      return;
    }

    const sequence = Number(formData.sequence) || modules.length + 1;

    setSaving(true);

    const payload = {
      course_id: selectedCourseId,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      sequence,
      is_required: formData.isRequired,
    };

    const { error } = editingModuleId
      ? await supabase.from('course_modules').update(payload).eq('id', editingModuleId)
      : await supabase.from('course_modules').insert(payload);

    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    closeModal();
    fetchModules(selectedCourseId);
  }

  async function deleteModule(moduleId: string) {
    setDeletingId(moduleId);
    setDeleteError(null);

    const { error } = await supabase.from('course_modules').delete().eq('id', moduleId);

    setDeletingId(null);

    if (error) {
      setDeleteError(
        error.message.includes('violates foreign key')
          ? 'This module already has scheduled sessions or student progress attached — remove those first.'
          : error.message
      );
      return;
    }

    setConfirmDeleteId(null);
    fetchModules(selectedCourseId);
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const requiredCount = modules.filter((module) => module.is_required).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl text-[#284342]">Course Modules</h1>
          <p className="text-[#6b6b6b] mt-1">
            Define the curriculum structure that class scheduling and student
            progress tracking are built on.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={!selectedCourseId}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={20} />
          Add Module
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm text-[#284342]">Course:</label>

          {coursesLoading && (
            <span className="text-sm text-[#6b6b6b]">Loading courses...</span>
          )}

          {!coursesLoading && courses.length === 0 && (
            <span className="text-sm text-[#6b6b6b]">
              No active courses found — add one under Courses first.
            </span>
          )}

          {!coursesLoading && courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          )}

          {!loading && selectedCourse && (
            <span className="text-sm text-[#6b6b6b]">
              {modules.length} module{modules.length === 1 ? '' : 's'} •{' '}
              {requiredCount} required
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading modules...
            </div>
          )}

          {!loading && selectedCourseId && modules.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No modules defined for {selectedCourse?.course_name} yet. Add the
              first one to start tracking progress and scheduling sessions
              against it.
            </div>
          )}

          {!loading &&
            modules.map((module) => (
              <div key={module.id} className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-[240px]">
                    <div className="w-8 h-8 rounded-full bg-[#e9da95]/20 flex items-center justify-center text-[#284342] text-sm shrink-0 mt-0.5">
                      <GripVertical size={14} className="opacity-0 absolute" />
                      {module.sequence}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg text-[#284342]">
                          {module.title}
                        </h3>

                        {module.is_required && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#284342]/10 text-[#284342]">
                            Required
                          </span>
                        )}
                      </div>

                      {module.description && (
                        <p className="text-sm text-[#6b6b6b]">
                          {module.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-[#6b6b6b]">
                        <span className="flex items-center gap-1.5">
                          <Users size={13} />
                          {module.totalCount} enrolled
                        </span>

                        {module.totalCount > 0 && (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-green-700" />
                            {module.completedCount}/{module.totalCount} completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(module)}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                    >
                      Edit
                    </button>

                    {confirmDeleteId === module.id ? (
                      <>
                        <button
                          onClick={() => deleteModule(module.id)}
                          disabled={deletingId === module.id}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {deletingId === module.id ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDeleteId(module.id);
                          setDeleteError(null);
                        }}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-red-700 hover:bg-red-50 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {confirmDeleteId === module.id && deleteError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{deleteError}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              {editingModuleId ? 'Edit Module' : 'Add Module'} —{' '}
              {selectedCourse?.course_name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Title
                </label>
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Foundation Skin Prep"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    Sequence
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sequence}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sequence: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>

                <label className="flex items-center gap-2 pb-3 text-sm text-[#284342]">
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isRequired: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  Required for completion
                </label>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={saveModule}
                disabled={saving}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingModuleId ? 'Save Changes' : 'Add Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
