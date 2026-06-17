import { Star, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

interface SubmissionReview {
  id: string;
  student: string;
  assignment: string;
  course: string;
  submittedDate: string;
  status: 'Pending Review' | 'Reviewed' | 'Revision Requested';
  score?: number;
  feedback?: string;
}

export default function TeacherFeedback() {
  const submissions: SubmissionReview[] = [
    {
      id: 'SR001',
      student: 'Jessica Lim Mei Ling',
      assignment: 'Editorial Makeup Project',
      course: 'Professional Makeup Artist Course',
      submittedDate: '2026-05-28',
      status: 'Pending Review',
    },
    {
      id: 'SR002',
      student: 'Amanda Ng Siew May',
      assignment: 'Bridal Makeup Portfolio',
      course: 'Bridal Makeup Specialist',
      submittedDate: '2026-05-25',
      status: 'Reviewed',
      score: 92,
      feedback: 'Excellent color matching and blending techniques. Great attention to detail.',
    },
    {
      id: 'SR003',
      student: 'Rachel Tan Li Ying',
      assignment: 'Airbrush Technique Demo',
      course: 'Advanced Airbrush Course',
      submittedDate: '2026-06-01',
      status: 'Revision Requested',
      score: 75,
      feedback: 'Good foundation work, but needs more practice on gradient transitions.',
    },
    {
      id: 'SR004',
      student: 'Melissa Chong Hui Wen',
      assignment: 'SFX Character Makeup',
      course: 'Special Effects Makeup',
      submittedDate: '2026-05-30',
      status: 'Reviewed',
      score: 88,
      feedback: 'Creative concept and solid execution. Excellent use of prosthetics.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Teacher Feedback</h1>
        <p className="text-[#6b6b6b] mt-1">Review student submissions and provide feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Pending Review</p>
          <p className="text-3xl text-yellow-700">
            {submissions.filter((s) => s.status === 'Pending Review').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Reviewed</p>
          <p className="text-3xl text-green-700">
            {submissions.filter((s) => s.status === 'Reviewed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Revision Requested</p>
          <p className="text-3xl text-blue-700">
            {submissions.filter((s) => s.status === 'Revision Requested').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Student Submissions</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {submissions.map((submission) => (
            <div key={submission.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg text-[#284342]">{submission.assignment}</h3>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        submission.status === 'Reviewed'
                          ? 'bg-green-100 text-green-700'
                          : submission.status === 'Revision Requested'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Student</p>
                      <p className="text-[#284342]">{submission.student}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Course</p>
                      <p className="text-[#284342]">{submission.course}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Submitted</p>
                      <p className="text-[#284342]">{submission.submittedDate}</p>
                    </div>
                    {submission.score && (
                      <div>
                        <p className="text-xs text-[#6b6b6b] mb-1">Score</p>
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-[#e9da95] fill-[#e9da95]" />
                          <p className="text-[#284342]">{submission.score}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {submission.feedback && (
                    <div className="p-3 bg-[#f8f8f6] rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-[#284342]" />
                        <p className="text-xs text-[#6b6b6b]">Feedback:</p>
                      </div>
                      <p className="text-sm text-[#284342]">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                {submission.status === 'Pending Review' ? (
                  <>
                    <button className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm flex items-center gap-2">
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      Request Revision
                    </button>
                  </>
                ) : (
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    Edit Feedback
                  </button>
                )}
                <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                  View Submission
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
