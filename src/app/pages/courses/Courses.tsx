import { Plus, Edit, Users, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
}

interface CourseCategory {
  id: string;
  category_name: string;
}

export default function Courses() {
  const [showModal, setShowModal] = useState(false);
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
    }));

    setCourses(mappedCourses);
    setLoading(false);
  }

  async function createCourse() {
    if (!formData.name || !formData.categoryId || !formData.fee) {
      alert('Please fill in course name, category, and fee.');
      return;
    }

    const { error } = await supabase.from('courses').insert({
      course_name: formData.name,
      category_id: formData.categoryId,
      duration: formData.duration,
      course_fee: Number(formData.fee),
      description: formData.description,
      status: 'active',
    });

    if (error) {
      alert(`Failed to create course: ${error.message}`);
      return;
    }

    setFormData({
      name: '',
      categoryId: '',
      duration: '',
      fee: '',
      description: '',
    });

    setShowModal(false);
    fetchCourses();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Courses</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage academy course offerings
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading courses...
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          No courses found.
        </div>
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
                  {course.status}
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
                    {course.students} students in {course.batches} batches
                  </span>
                </div>
              </div>

              <div className="mb-4 pb-4 border-b border-[rgba(40,67,66,0.1)]">
                <p className="text-xs text-[#6b6b6b] mb-1">Course Fee</p>
                <p className="text-2xl text-[#284342]">
                  RM {course.fee.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
                  View Details
                </button>

                <button className="p-2 rounded-lg border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors">
                  <Edit size={16} className="text-[#284342]" />
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
              Add New Course
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Course Name
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
                  placeholder="e.g., Professional Makeup Artist Course"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    Category
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
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#284342] mb-2">
                    Duration
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
                    placeholder="e.g., 6 months"
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Course Fee (RM)
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
                  placeholder="8000"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Description
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
                  placeholder="Course description..."
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={createCourse}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}