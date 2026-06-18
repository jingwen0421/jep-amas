import { useEffect, useState } from 'react';
import { Star, BarChart3, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SurveyResponse {
  id: string;
  type: 'Teacher' | 'Course';
  subject: string;
  responses: number;
  avgRating: number;
  date: string;
  feedback: string;
}

export default function SurveyFeedback() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  async function fetchSurveys() {
    setLoading(true);

    const { data, error } = await supabase
      .from('surveys')
      .select(`
        id,
        rating,
        feedback,
        submitted_at,
        courses(course_name),
        teachers(
          specialization,
          users(full_name)
        )
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching surveys:', error.message);
      setLoading(false);
      return;
    }

    const mapped: SurveyResponse[] = (data || []).map((survey: any) => ({
      id: survey.id,
      type: survey.teacher_id ? 'Teacher' : 'Course',
      subject: getSurveySubject(survey),
      responses: 1,
      avgRating: Number(survey.rating || 0),
      date: survey.submitted_at
        ? new Date(survey.submitted_at).toISOString().slice(0, 10)
        : '-',
      feedback: survey.feedback || '',
    }));

    setSurveys(mapped);
    setLoading(false);
  }

  async function createDemoSurvey() {
    const { data: student } = await supabase.from('students').select('id').limit(1).single();
    const { data: course } = await supabase.from('courses').select('id').limit(1).single();
    const { data: teacher } = await supabase.from('teachers').select('id').limit(1).single();

    const { error } = await supabase.from('surveys').insert({
      student_id: student?.id || null,
      course_id: course?.id || null,
      teacher_id: teacher?.id || null,
      rating: 5,
      feedback: 'Great class experience. The teacher explained clearly.',
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      alert(`Failed to create survey: ${error.message}`);
      return;
    }

    fetchSurveys();
  }

  const totalResponses = surveys.reduce((acc, s) => acc + s.responses, 0);

  const overallRating =
    surveys.length > 0
      ? surveys.reduce((acc, s) => acc + s.avgRating, 0) / surveys.length
      : 0;

  const satisfactionRate =
    surveys.length > 0
      ? Math.round((surveys.filter((s) => s.avgRating >= 4).length / surveys.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Survey & Feedback</h1>
          <p className="text-[#6b6b6b] mt-1">Collect and analyze student feedback</p>
        </div>
        <button
          onClick={createDemoSurvey}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          Create Survey
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Surveys" value={surveys.length.toString()} />
        <SummaryCard label="Total Responses" value={totalResponses.toString()} color="text-blue-700" />
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Overall Rating</p>
          <div className="flex items-center gap-2">
            <Star size={24} className="text-[#e9da95] fill-[#e9da95]" />
            <p className="text-3xl text-[#284342]">{overallRating.toFixed(1)}</p>
          </div>
        </div>
        <SummaryCard label="Satisfaction Rate" value={`${satisfactionRate}%`} color="text-green-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Recent Surveys</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading surveys...
            </div>
          )}

          {!loading && surveys.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No survey feedback found.
            </div>
          )}

          {!loading &&
            surveys.map((survey) => (
              <div key={survey.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare size={20} className="text-[#284342]" />
                      <h3 className="text-lg text-[#284342]">{survey.subject}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          survey.type === 'Teacher'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {survey.type} Evaluation
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Info label="Responses" value={survey.responses.toString()} />
                      <div>
                        <p className="text-xs text-[#6b6b6b] mb-1">Average Rating</p>
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-[#e9da95] fill-[#e9da95]" />
                          <p className="text-[#284342]">{survey.avgRating}/5.0</p>
                        </div>
                      </div>
                      <Info label="Date" value={survey.date} />
                    </div>

                    {survey.feedback && (
                      <div className="mt-3 p-3 bg-[#f8f8f6] rounded-lg text-sm text-[#284342]">
                        {survey.feedback}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  <button
                    onClick={() => alert(`Average Rating: ${survey.avgRating}/5.0`)}
                    className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm flex items-center gap-2"
                  >
                    <BarChart3 size={16} />
                    View Results
                  </button>
                  <button
                    onClick={() => alert(survey.feedback || 'No written feedback.')}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                  >
                    View Responses
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function getSurveySubject(survey: any) {
  const teacher = Array.isArray(survey.teachers) ? survey.teachers[0] : survey.teachers;
  const teacherUser = Array.isArray(teacher?.users) ? teacher.users[0] : teacher?.users;

  if (teacherUser?.full_name) return `${teacherUser.full_name} - Teaching Quality`;
  if (teacher?.specialization) return `${teacher.specialization} - Teaching Quality`;

  const course = Array.isArray(survey.courses) ? survey.courses[0] : survey.courses;
  return course?.course_name || 'Course Feedback';
}

function SummaryCard({
  label,
  value,
  color = 'text-[#284342]',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-[#284342]">{value}</p>
    </div>
  );
}