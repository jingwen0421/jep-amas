import { useEffect, useState } from 'react';
import { Star, BarChart3, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface SurveyResponse {
  id: string;
  type: 'Teacher' | 'Course';
  isTeachingQuality: boolean;
  subjectName: string | null;
  responses: number;
  avgRating: number;
  date: string;
  feedback: string;
}

function getSurveySubjectLabel(survey: SurveyResponse, t: Translate) {
  if (survey.subjectName) {
    return survey.isTeachingQuality
      ? t('surveyFeedback.teachingQualitySubject', { name: survey.subjectName })
      : survey.subjectName;
  }
  return t('surveyFeedback.courseFeedbackFallback');
}

export default function SurveyFeedback() {
  const { t } = useLanguage();
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingSurvey, setViewingSurvey] = useState<SurveyResponse | null>(
    null
  );

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

    const mapped: SurveyResponse[] = (data || []).map((survey: any) => {
      const subject = getSurveySubject(survey);
      return {
        id: survey.id,
        type: survey.teacher_id ? 'Teacher' : 'Course',
        isTeachingQuality: subject.isTeachingQuality,
        subjectName: subject.name,
        responses: 1,
        avgRating: Number(survey.rating || 0),
        date: survey.submitted_at
          ? new Date(survey.submitted_at).toISOString().slice(0, 10)
          : '-',
        feedback: survey.feedback || '',
      };
    });

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
      alert(t('surveyFeedback.error.createFailed', { message: error.message }));
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
          <h1 className="text-3xl text-[#284342]">{t('surveyFeedback.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">{t('surveyFeedback.subtitle')}</p>
        </div>
        <button
          onClick={createDemoSurvey}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          {t('surveyFeedback.createSurvey')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label={t('surveyFeedback.stat.totalSurveys')} value={surveys.length.toString()} />
        <SummaryCard label={t('surveyFeedback.stat.totalResponses')} value={totalResponses.toString()} color="text-blue-700" />
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">{t('surveyFeedback.stat.overallRating')}</p>
          <div className="flex items-center gap-2">
            <Star size={24} className="text-[#e9da95] fill-[#e9da95]" />
            <p className="text-3xl text-[#284342]">{overallRating.toFixed(1)}</p>
          </div>
        </div>
        <SummaryCard label={t('surveyFeedback.stat.satisfactionRate')} value={`${satisfactionRate}%`} color="text-green-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('surveyFeedback.recentSurveys')}</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('surveyFeedback.loading')}
            </div>
          )}

          {!loading && surveys.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('surveyFeedback.empty')}
            </div>
          )}

          {!loading &&
            surveys.map((survey) => (
              <div key={survey.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare size={20} className="text-[#284342]" />
                      <h3 className="text-lg text-[#284342]">{getSurveySubjectLabel(survey, t)}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          survey.type === 'Teacher'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {survey.type === 'Teacher' ? t('surveyFeedback.type.teacherEvaluation') : t('surveyFeedback.type.courseEvaluation')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Info label={t('surveyFeedback.responses')} value={survey.responses.toString()} />
                      <div>
                        <p className="text-xs text-[#6b6b6b] mb-1">{t('surveyFeedback.averageRating')}</p>
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-[#e9da95] fill-[#e9da95]" />
                          <p className="text-[#284342]">{survey.avgRating}/5.0</p>
                        </div>
                      </div>
                      <Info label={t('surveyFeedback.date')} value={survey.date} />
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
                    onClick={() => setViewingSurvey(survey)}
                    className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm flex items-center gap-2"
                  >
                    <BarChart3 size={16} />
                    {t('surveyFeedback.viewResults')}
                  </button>
                  <button
                    onClick={() => setViewingSurvey(survey)}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
                  >
                    {t('surveyFeedback.viewResponses')}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {viewingSurvey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl text-[#284342] mb-1">
              {getSurveySubjectLabel(viewingSurvey, t)}
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-6">
              {viewingSurvey.type === 'Teacher' ? t('surveyFeedback.type.teacherEvaluation') : t('surveyFeedback.type.courseEvaluation')} - {viewingSurvey.date}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="text-[#e9da95] fill-[#e9da95]" />
              <p className="text-2xl text-[#284342]">
                {viewingSurvey.avgRating}/5.0
              </p>
            </div>

            <div>
              <p className="text-xs text-[#6b6b6b] mb-2">{t('surveyFeedback.writtenFeedback')}</p>
              <div className="p-3 bg-[#f8f8f6] rounded-lg text-sm text-[#284342]">
                {viewingSurvey.feedback || t('surveyFeedback.noWrittenFeedback')}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setViewingSurvey(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('surveyFeedback.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getSurveySubject(survey: any): { name: string | null; isTeachingQuality: boolean } {
  const teacher = Array.isArray(survey.teachers) ? survey.teachers[0] : survey.teachers;
  const teacherUser = Array.isArray(teacher?.users) ? teacher.users[0] : teacher?.users;

  if (teacherUser?.full_name) return { name: teacherUser.full_name, isTeachingQuality: true };
  if (teacher?.specialization) return { name: teacher.specialization, isTeachingQuality: true };

  const course = Array.isArray(survey.courses) ? survey.courses[0] : survey.courses;
  return { name: course?.course_name || null, isTeachingQuality: false };
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