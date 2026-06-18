import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router';
import { Upload, X } from 'lucide-react';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    icPassport: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyRelation: '',
    makeupExperience: '',
    healthConditions: '',
    languagePreference: 'English',
    pdpaConsent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const studentCode = `S${Date.now().toString().slice(-5)}`;

    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({
        student_code: studentCode,
        full_name: formData.fullName,
        ic_passport: formData.icPassport,
        phone: formData.phone,
        email: formData.email,
        emergency_contact_phone: formData.emergencyContact,
        emergency_contact_name: formData.emergencyRelation,
        makeup_experience: formData.makeupExperience,
        health_condition: formData.healthConditions,
        status: 'inactive',
        progress: 0,
        enroll_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();

    if (studentError) {
      console.error(studentError.message);
      alert(`Failed to submit student: ${studentError.message}`);
      return;
    }

    const { data: firstCourse, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .limit(1)
      .single();

    if (courseError) {
      console.error(courseError.message);
      alert(`Student created, but failed to find course: ${courseError.message}`);
      return;
    }

    const { error: applicationError } = await supabase
      .from('registration_applications')
      .insert({
        student_id: newStudent.id,
        course_id: firstCourse.id,
        application_status: 'pending',
        submitted_at: new Date().toISOString(),
      });

    if (applicationError) {
      console.error(applicationError.message);
      alert(`Student created, but failed to send approval: ${applicationError.message}`);
      return;
    }

    alert('Application submitted successfully. It has been sent for approval.');
    navigate('/app/students/approval');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Student Registration</h1>
        <p className="text-[#6b6b6b] mt-1">Register a new student for JEP Academy</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm text-[#284342] mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="As per IC/Passport"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                IC / Passport Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="icPassport"
                value={formData.icPassport}
                onChange={handleChange}
                required
                placeholder="123456-12-1234"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+60 12-345 6789"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[#284342] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="student@email.com"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Emergency Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                required
                placeholder="+60 12-345 6789"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                name="emergencyRelation"
                value={formData.emergencyRelation}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="">Select Relationship</option>
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Background Information */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Background Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-[#284342] mb-2">Makeup Experience</label>
              <select
                name="makeupExperience"
                value={formData.makeupExperience}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="">Select Experience Level</option>
                <option value="Beginner">Beginner (No experience)</option>
                <option value="Some Experience">Some Experience (1-2 years)</option>
                <option value="Intermediate">Intermediate (3-5 years)</option>
                <option value="Advanced">Advanced (5+ years)</option>
                <option value="Professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">Health Conditions / Allergies</label>
              <textarea
                name="healthConditions"
                value={formData.healthConditions}
                onChange={handleChange}
                placeholder="Please specify any health conditions, allergies, or special requirements..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">Preferred Language</label>
              <select
                name="languagePreference"
                value={formData.languagePreference}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="English">English</option>
                <option value="Chinese">Chinese (中文)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Document Upload</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[rgba(40,67,66,0.2)] rounded-lg p-8 text-center hover:border-[#e9da95] transition-colors">
              <Upload size={48} className="mx-auto text-[#6b6b6b] mb-4" />
              <p className="text-sm text-[#284342] mb-2">Upload IC/Passport Copy</p>
              <p className="text-xs text-[#6b6b6b] mb-4">PDF, JPG, or PNG (Max 5MB)</p>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="ic-upload" />
              <label
                htmlFor="ic-upload"
                className="inline-block px-6 py-2 bg-[#f8f8f6] text-[#284342] rounded-lg hover:bg-[#e9da95]/20 transition-colors cursor-pointer"
              >
                Choose File
              </label>
            </div>
          </div>
        </div>

        {/* PDPA Consent */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Consent & Agreement</h2>
          <div className="space-y-4">
            <div className="p-4 bg-[#f8f8f6] rounded-lg">
              <p className="text-sm text-[#6b6b6b] mb-4">
                I consent to JEP Image Makeup Academy collecting, using, and processing my personal data in accordance with the Personal Data Protection Act 2010.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="pdpaConsent"
                  checked={formData.pdpaConsent}
                  onChange={handleChange}
                  required
                  className="mt-1 w-5 h-5 rounded border-[rgba(40,67,66,0.2)] text-[#284342] focus:ring-2 focus:ring-[#284342]"
                />
                <span className="text-sm text-[#284342]">
                  I have read and agree to the terms and conditions <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            <div className="border border-[rgba(40,67,66,0.1)] rounded-lg p-4">
              <p className="text-sm text-[#284342] mb-3">Digital Signature</p>
              <div className="border-2 border-dashed border-[rgba(40,67,66,0.2)] rounded-lg h-32 flex items-center justify-center text-[#6b6b6b] hover:border-[#e9da95] transition-colors cursor-pointer">
                <span className="text-sm">Click to sign</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/students/list')}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
          >
            Submit Registration
          </button>
        </div>
      </form>
    </div>
  );
}
