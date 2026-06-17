import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Batch {
  id: string;
  name: string;
  course: string;
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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

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

  async function createBatch() {
    if (!formData.courseId || !formData.batchName || !formData.capacity) {
      alert('Please fill in course, batch name, and capacity.');
      return;
    }

    const { error } = await supabase.from('class_batches').insert({
      course_id: formData.courseId,
      batch_name: formData.batchName,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      capacity: Number(formData.capacity),
      schedule: formData.schedule,
      lead_teacher: formData.leadTeacher,
      status: 'active',
    });

    if (error) {
      alert(`Failed to create batch: ${error.message}`);
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

    setShowModal(false);
    fetchBatches();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Class Batches</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage student batches for each course
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create Batch
        </button>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            Loading class batches...
          </div>
        )}

        {!loading && batches.length === 0 && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            No class batches found.
          </div>
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
                      {batch.status}
                    </span>
                  </div>

                  <p className="text-sm text-[#6b6b6b]">{batch.course}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-[#6b6b6b] mb-1">Capacity</p>
                  <p className="text-2xl text-[#284342]">
                    {batch.students}/{batch.capacity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Info label="Start Date" value={batch.startDate} />
                <Info label="End Date" value={batch.endDate} />
                <Info label="Schedule" value={batch.schedule} />
                <Info label="Lead Teacher" value={batch.teacher} />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
                  View Students
                </button>

                <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                  Edit Batch
                </button>

                <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                  Schedule
                </button>
              </div>
            </div>
          ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">Create Batch</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Course
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
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Batch Name
                </label>

                <input
                  value={formData.batchName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      batchName: e.target.value,
                    }))
                  }
                  placeholder="e.g., PMAC-2026-A"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startDate: value }))
                  }
                />

                <Input
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, endDate: value }))
                  }
                />
              </div>

              <Input
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, capacity: value }))
                }
              />

              <Input
                label="Schedule"
                value={formData.schedule}
                placeholder="e.g., Mon-Wed-Fri, 9AM-12PM"
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, schedule: value }))
                }
              />

              <Input
                label="Lead Teacher"
                value={formData.leadTeacher}
                placeholder="e.g., Juju Lim"
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, leadTeacher: value }))
                }
              />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={createBatch}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Create Batch
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