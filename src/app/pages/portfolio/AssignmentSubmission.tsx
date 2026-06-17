import { Upload, FileText, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  submittedDate?: string;
  status: 'Pending' | 'Submitted' | 'Overdue' | 'Graded';
  score?: number;
  feedback?: string;
}

export default function AssignmentSubmission() {
  const assignments: Assignment[] = [
    {
      id: 'AS001',
      title: 'Bridal Makeup Portfolio - 3 Looks',
      course: 'Professional Makeup Artist Course',
      dueDate: '2026-06-10',
      status: 'Pending',
    },
    {
      id: 'AS002',
      title: 'Editorial Makeup Project',
      course: 'Professional Makeup Artist Course',
      dueDate: '2026-05-30',
      submittedDate: '2026-05-28',
      status: 'Graded',
      score: 92,
      feedback: 'Excellent creativity and technique execution',
    },
    {
      id: 'AS003',
      title: 'Airbrush Technique Demonstration',
      course: 'Advanced Airbrush Course',
      dueDate: '2026-06-05',
      submittedDate: '2026-06-04',
      status: 'Submitted',
    },
    {
      id: 'AS004',
      title: 'Natural Glam Tutorial Video',
      course: 'Professional Makeup Artist Course',
      dueDate: '2026-05-25',
      status: 'Overdue',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Assignment Submission</h1>
        <p className="text-[#6b6b6b] mt-1">Submit assignments and track submission status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Assignments</p>
          <p className="text-3xl text-[#284342]">{assignments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Pending</p>
          <p className="text-3xl text-yellow-700">
            {assignments.filter((a) => a.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Submitted</p>
          <p className="text-3xl text-blue-700">
            {assignments.filter((a) => a.status === 'Submitted').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Graded</p>
          <p className="text-3xl text-green-700">
            {assignments.filter((a) => a.status === 'Graded').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">My Assignments</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`p-6 hover:bg-[#f8f8f6] transition-colors ${
                assignment.status === 'Overdue' ? 'bg-red-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-[#284342]" />
                    <h3 className="text-lg text-[#284342]">{assignment.title}</h3>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        assignment.status === 'Graded'
                          ? 'bg-green-100 text-green-700'
                          : assignment.status === 'Submitted'
                          ? 'bg-blue-100 text-blue-700'
                          : assignment.status === 'Overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>

                  <p className="text-sm text-[#6b6b6b] mb-3">{assignment.course}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-[#6b6b6b] mb-1">
                        <Calendar size={14} />
                        <span className="text-xs">Due Date</span>
                      </div>
                      <p className="text-[#284342]">{assignment.dueDate}</p>
                    </div>
                    {assignment.submittedDate && (
                      <div>
                        <div className="flex items-center gap-2 text-[#6b6b6b] mb-1">
                          <CheckCircle2 size={14} />
                          <span className="text-xs">Submitted</span>
                        </div>
                        <p className="text-green-700">{assignment.submittedDate}</p>
                      </div>
                    )}
                    {assignment.score && (
                      <div>
                        <div className="flex items-center gap-2 text-[#6b6b6b] mb-1">
                          <Clock size={14} />
                          <span className="text-xs">Score</span>
                        </div>
                        <p className="text-[#284342]">{assignment.score}%</p>
                      </div>
                    )}
                  </div>

                  {assignment.feedback && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-[#6b6b6b] mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-green-700">{assignment.feedback}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                {assignment.status === 'Pending' || assignment.status === 'Overdue' ? (
                  <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm flex items-center gap-2">
                    <Upload size={16} />
                    Submit Assignment
                  </button>
                ) : (
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    View Submission
                  </button>
                )}
                <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
