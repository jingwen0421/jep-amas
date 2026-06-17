import { Star, BarChart3, MessageSquare } from 'lucide-react';

interface SurveyResponse {
  id: string;
  type: 'Teacher' | 'Course';
  subject: string;
  responses: number;
  avgRating: number;
  date: string;
}

export default function SurveyFeedback() {
  const surveys: SurveyResponse[] = [
    {
      id: 'SF001',
      type: 'Teacher',
      subject: 'Juju Lim - Teaching Quality',
      responses: 15,
      avgRating: 4.8,
      date: '2026-05-30',
    },
    {
      id: 'SF002',
      type: 'Course',
      subject: 'Professional Makeup Artist Course',
      responses: 18,
      avgRating: 4.6,
      date: '2026-05-25',
    },
    {
      id: 'SF003',
      type: 'Teacher',
      subject: 'Esther - Teaching Quality',
      responses: 12,
      avgRating: 4.9,
      date: '2026-05-20',
    },
    {
      id: 'SF004',
      type: 'Course',
      subject: 'Bridal Makeup Specialist',
      responses: 10,
      avgRating: 4.7,
      date: '2026-05-15',
    },
    {
      id: 'SF005',
      type: 'Teacher',
      subject: 'Wong Yi Feng - Teaching Quality',
      responses: 14,
      avgRating: 4.7,
      date: '2026-05-18',
    },
    {
      id: 'SF006',
      type: 'Teacher',
      subject: 'Pauline Tang - Teaching Quality',
      responses: 13,
      avgRating: 4.9,
      date: '2026-05-22',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Survey & Feedback</h1>
          <p className="text-[#6b6b6b] mt-1">Collect and analyze student feedback</p>
        </div>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors">
          Create Survey
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Surveys</p>
          <p className="text-3xl text-[#284342]">{surveys.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Responses</p>
          <p className="text-3xl text-blue-700">
            {surveys.reduce((acc, s) => acc + s.responses, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Overall Rating</p>
          <div className="flex items-center gap-2">
            <Star size={24} className="text-[#e9da95] fill-[#e9da95]" />
            <p className="text-3xl text-[#284342]">4.7</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Satisfaction Rate</p>
          <p className="text-3xl text-green-700">94%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Recent Surveys</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {surveys.map((survey) => (
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
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Responses</p>
                      <p className="text-[#284342]">{survey.responses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Average Rating</p>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-[#e9da95] fill-[#e9da95]" />
                        <p className="text-[#284342]">{survey.avgRating}/5.0</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Date</p>
                      <p className="text-[#284342]">{survey.date}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm flex items-center gap-2">
                  <BarChart3 size={16} />
                  View Results
                </button>
                <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
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
