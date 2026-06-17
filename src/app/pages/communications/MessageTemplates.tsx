import { Edit, Copy, MessageSquare } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: 'WhatsApp' | 'Email';
  subject?: string;
  content: string;
  variables: string[];
  lastModified: string;
}

export default function MessageTemplates() {
  const templates: Template[] = [
    {
      id: 'T001',
      name: 'Class Reminder',
      category: 'WhatsApp',
      content: 'Hi {studentName}, reminder that your {className} class is tomorrow at {time} in {room}. See you there!',
      variables: ['studentName', 'className', 'time', 'room'],
      lastModified: '2026-05-15',
    },
    {
      id: 'T002',
      name: 'Payment Reminder',
      category: 'Email',
      subject: 'Payment Reminder - JEP Academy',
      content: 'Dear {studentName}, this is a friendly reminder that your payment of RM {amount} for {course} is due on {dueDate}. Please arrange payment at your earliest convenience.',
      variables: ['studentName', 'amount', 'course', 'dueDate'],
      lastModified: '2026-05-20',
    },
    {
      id: 'T003',
      name: 'Appointment Confirmation',
      category: 'WhatsApp',
      content: 'Hi {studentName}, your consultation with {teacher} is confirmed for {date} at {time}. Looking forward to seeing you!',
      variables: ['studentName', 'teacher', 'date', 'time'],
      lastModified: '2026-05-18',
    },
    {
      id: 'T004',
      name: 'Welcome Email',
      category: 'Email',
      subject: 'Welcome to JEP Image Makeup Academy!',
      content: 'Dear {studentName}, welcome to JEP Academy! We\'re excited to have you enrolled in {course}. Your classes begin on {startDate}.',
      variables: ['studentName', 'course', 'startDate'],
      lastModified: '2026-04-25',
    },
    {
      id: 'T005',
      name: 'Certificate Ready',
      category: 'WhatsApp',
      content: 'Congratulations {studentName}! Your {certificateType} is ready for collection. Please visit our office during business hours.',
      variables: ['studentName', 'certificateType'],
      lastModified: '2026-05-10',
    },
    {
      id: 'T006',
      name: 'Course Completion',
      category: 'Email',
      subject: 'Congratulations on Completing Your Course!',
      content: 'Dear {studentName}, congratulations on successfully completing {course}! Your final score is {score}%. We wish you all the best in your makeup artistry career.',
      variables: ['studentName', 'course', 'score'],
      lastModified: '2026-05-05',
    },
  ];

  const whatsappTemplates = templates.filter((t) => t.category === 'WhatsApp');
  const emailTemplates = templates.filter((t) => t.category === 'Email');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Message Templates</h1>
          <p className="text-[#6b6b6b] mt-1">Manage reusable message templates for communications</p>
        </div>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors">
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Templates</p>
          <p className="text-3xl text-[#284342]">{templates.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">WhatsApp</p>
          <p className="text-3xl text-green-700">{whatsappTemplates.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Email</p>
          <p className="text-3xl text-blue-700">{emailTemplates.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">WhatsApp Templates</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {whatsappTemplates.map((template) => (
            <div key={template.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare size={20} className="text-green-700" />
                    <h3 className="text-lg text-[#284342]">{template.name}</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                      WhatsApp
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg mb-3">
                    <p className="text-sm text-[#284342]">{template.content}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#6b6b6b]">Variables:</span>
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="text-xs px-2 py-1 rounded bg-[#e9da95]/20 text-[#284342]"
                      >
                        {`{${variable}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <p className="text-xs text-[#6b6b6b]">Last modified: {template.lastModified}</p>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2">
                    <Edit size={14} />
                    Edit
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2">
                    <Copy size={14} />
                    Duplicate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Email Templates</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {emailTemplates.map((template) => (
            <div key={template.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare size={20} className="text-blue-700" />
                    <h3 className="text-lg text-[#284342]">{template.name}</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      Email
                    </span>
                  </div>

                  {template.subject && (
                    <div className="mb-2">
                      <span className="text-xs text-[#6b6b6b]">Subject:</span>
                      <p className="text-sm text-[#284342]">{template.subject}</p>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 rounded-lg mb-3">
                    <p className="text-sm text-[#284342]">{template.content}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#6b6b6b]">Variables:</span>
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="text-xs px-2 py-1 rounded bg-[#e9da95]/20 text-[#284342]"
                      >
                        {`{${variable}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <p className="text-xs text-[#6b6b6b]">Last modified: {template.lastModified}</p>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2">
                    <Edit size={14} />
                    Edit
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2">
                    <Copy size={14} />
                    Duplicate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
