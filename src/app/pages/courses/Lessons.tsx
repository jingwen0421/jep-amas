import { Plus, BookOpen, Clock, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Lesson {
  id: string;
  title: string;
  course: string;
  duration: string;
  materials: string[];
  objectives: string[];
  order: number;
}

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    setLoading(true);

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id,
        lesson_title,
        lesson_objective,
        duration,
        materials,
        objectives,
        lesson_order,
        class_batches(
          courses(course_name)
        )
      `)
      .order('lesson_order', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error.message);
      setLoading(false);
      return;
    }

    const mapped: Lesson[] = (data || []).map((lesson: any) => ({
      id: lesson.id,
      title: lesson.lesson_title || '-',
      course:
        lesson.class_batches?.courses?.course_name ||
        'Unassigned Course',
      duration: lesson.duration || '3 hours',
      materials: lesson.materials || [],
      objectives:
        lesson.objectives ||
        (lesson.lesson_objective ? [lesson.lesson_objective] : []),
      order: lesson.lesson_order || 1,
    }));

    setLessons(mapped);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Lessons</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage lesson content and curriculum
          </p>
        </div>

        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
          <Plus size={20} />
          Add Lesson
        </button>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            Loading lessons...
          </div>
        )}

        {!loading && lessons.length === 0 && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
            No lessons found.
          </div>
        )}

        {!loading &&
          lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e9da95]/20 flex items-center justify-center text-[#284342]">
                    {lesson.order}
                  </div>

                  <div>
                    <h3 className="text-lg text-[#284342]">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-[#6b6b6b]">
                      {lesson.course}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
                  <Clock size={16} />
                  <span>{lesson.duration}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-sm text-[#284342] mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Required Materials
                  </p>

                  <ul className="space-y-1">
                    {lesson.materials.length === 0 && (
                      <li className="text-sm text-[#6b6b6b] pl-4">-</li>
                    )}

                    {lesson.materials.map((material, idx) => (
                      <li key={idx} className="text-sm text-[#6b6b6b] pl-4">
                        • {material}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm text-[#284342] mb-2 flex items-center gap-2">
                    <BookOpen size={16} />
                    Learning Objectives
                  </p>

                  <ul className="space-y-1">
                    {lesson.objectives.length === 0 && (
                      <li className="text-sm text-[#6b6b6b] pl-4">-</li>
                    )}

                    {lesson.objectives.map((objective, idx) => (
                      <li key={idx} className="text-sm text-[#6b6b6b] pl-4">
                        • {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
                  Edit Lesson
                </button>

                <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                  View Content
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}