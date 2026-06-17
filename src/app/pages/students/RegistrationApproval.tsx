import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PendingRegistration {
  id: string;
  studentDbId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  appliedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  icPassport: string;
  emergencyContact: string;
}

export default function RegistrationApproval() {
  const [selectedApplication, setSelectedApplication] =
    useState<PendingRegistration | null>(null);

  const [applications, setApplications] = useState<PendingRegistration[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .in('status', ['inactive', 'active', 'suspended'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error.message);
      setLoading(false);
      return;
    }

    const mapped: PendingRegistration[] = (data || []).map((student) => ({
      id: student.student_code || '-',
      studentDbId: student.id,
      name: student.full_name || 'Unnamed Student',
      email: student.email || '-',
      phone: student.phone || '-',
      course: student.course || '-',
      appliedDate: student.created_at?.slice(0, 10) || '-',
      status:
        student.status === 'active'
          ? 'Approved'
          : student.status === 'suspended'
          ? 'Rejected'
          : 'Pending',
      icPassport: student.ic_passport || '-',
      emergencyContact: student.emergency_contact_phone || '-',
    }));

    setApplications(mapped);
    setApprovedCount(mapped.filter((a) => a.status === 'Approved').length);
    setRejectedCount(mapped.filter((a) => a.status === 'Rejected').length);
    setLoading(false);
  }

  async function approveApplication(studentDbId: string) {
    const { error } = await supabase
      .from('students')
      .update({ status: 'active' })
      .eq('id', studentDbId);

    if (error) {
      alert(`Failed to approve application: ${error.message}`);
      return;
    }

    setSelectedApplication(null);
    fetchApplications();
  }

  async function rejectApplication(studentDbId: string) {
    const { error } = await supabase
      .from('students')
      .update({ status: 'suspended' })
      .eq('id', studentDbId);

    if (error) {
      alert(`Failed to reject application: ${error.message}`);
      return;
    }

    setSelectedApplication(null);
    fetchApplications();
  }

  const pendingApplications = applications.filter(
    (app) => app.status === 'Pending'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Registration Approval</h1>
        <p className="text-[#6b6b6b] mt-1">
          Review and approve student registration applications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={24} className="text-yellow-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Pending Review</p>
              <p className="text-2xl text-yellow-700">
                {pendingApplications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Approved</p>
          <p className="text-3xl text-green-700">{approvedCount}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Rejected</p>
          <p className="text-3xl text-red-700">{rejectedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Pending Applications</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading applications...
            </div>
          )}

          {!loading && pendingApplications.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No pending applications.
            </div>
          )}

          {!loading &&
            pendingApplications.map((application) => (
              <div
                key={application.studentDbId}
                className="p-6 hover:bg-[#f8f8f6] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-[#284342]">
                        {application.name}
                      </h3>

                      <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Pending Review
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <Info label="Email" value={application.email} />
                      <Info label="Phone" value={application.phone} />
                      <Info label="Course" value={application.course} />
                      <Info label="Applied Date" value={application.appliedDate} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  <button
                    onClick={() => setSelectedApplication(application)}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </button>

                  <button
                    onClick={() => approveApplication(application.studentDbId)}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>

                  <button
                    onClick={() => rejectApplication(application.studentDbId)}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>

                  <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm">
                    Request More Info
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342]">Application Details</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Info label="Full Name" value={selectedApplication.name} />
                <Info label="IC/Passport" value={selectedApplication.icPassport} />
                <Info label="Email" value={selectedApplication.email} />
                <Info label="Phone" value={selectedApplication.phone} />
                <Info
                  label="Emergency Contact"
                  value={selectedApplication.emergencyContact}
                />
                <Info label="Applied Date" value={selectedApplication.appliedDate} />
              </div>

              <div className="mb-6">
                <p className="text-xs text-[#6b6b6b] mb-1">Course Applied</p>
                <p className="text-sm text-[#284342]">
                  {selectedApplication.course}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
              <button
                onClick={() => setSelectedApplication(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => approveApplication(selectedApplication.studentDbId)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={20} />
                Approve Application
              </button>

              <button
                onClick={() => rejectApplication(selectedApplication.studentDbId)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircle size={20} />
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}