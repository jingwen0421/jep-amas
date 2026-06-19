import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router';
import { Upload, X } from 'lucide-react';

interface Course {
  id: string;
  course_name: string;
}

export default function StudentRegistration() {
  const navigate = useNavigate();
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [icFile, setIcFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    courseId: '',
    pdpaConsent: false,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_name')
      .order('course_name', { ascending: true });

    if (error) {
      alert(`Failed to load courses: ${error.message}`);
      return;
    }

    setCourses(data || []);

    if (data && data.length > 0) {
      setFormData((prev) => ({
        ...prev,
        courseId: data[0].id,
      }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseId) {
      alert('Please select a course.');
      return;
    }

    if (!icFile) {
      alert('Please upload IC/Passport document.');
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please provide digital signature.');
      return;
    }

    setSubmitting(true);

    const duplicate = await checkDuplicateStudent();
    if (duplicate) {
      setSubmitting(false);
      return;
    }

    const studentCode = `S${Date.now().toString().slice(-5)}`;

    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({
        student_code: studentCode,
        full_name: formData.fullName.trim(),
        ic_passport: formData.icPassport.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        emergency_contact_phone: formData.emergencyContact.trim(),
        emergency_contact_name: formData.emergencyRelation,
        makeup_experience: formData.makeupExperience,
        health_condition: formData.healthConditions,
        status: 'inactive',
        progress: 0,
        enroll_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();

    if (studentError || !newStudent) {
      setSubmitting(false);
      alert(`Failed to submit student: ${studentError?.message}`);
      return;
    }

    const icUrl = await uploadIcDocument(newStudent.id);
    if (!icUrl) {
      setSubmitting(false);
      return;
    }

    const signatureUrl = await uploadSignature(newStudent.id);
    if (!signatureUrl) {
      setSubmitting(false);
      return;
    }

    const { error: updateStudentError } = await supabase
      .from('students')
      .update({
        ic_document_url: icUrl,
        signature_url: signatureUrl,
      })
      .eq('id', newStudent.id);

    if (updateStudentError) {
      setSubmitting(false);
      alert(`Student created, but document URLs failed: ${updateStudentError.message}`);
      return;
    }

    const { error: docsError } = await supabase.from('documents').insert([
      {
        student_id: newStudent.id,
        document_type: 'IC Copy',
        file_url: icUrl,
        uploaded_by: null,
        uploaded_at: new Date().toISOString(),
      },
      {
        student_id: newStudent.id,
        document_type: 'Digital Signature',
        file_url: signatureUrl,
        uploaded_by: null,
        uploaded_at: new Date().toISOString(),
      },
    ]);

    if (docsError) {
      setSubmitting(false);
      alert(`Documents upload recorded failed: ${docsError.message}`);
      return;
    }

    const { error: applicationError } = await supabase
      .from('registration_applications')
      .insert({
        student_id: newStudent.id,
        course_id: formData.courseId,
        application_status: 'pending',
        submitted_at: new Date().toISOString(),
      });

    if (applicationError) {
      setSubmitting(false);
      alert(`Student created, but failed to send approval: ${applicationError.message}`);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Student Registration Submitted',
      module: 'Student Registration',
      target_id: newStudent.id,
      old_data: null,
      new_data: {
        student_name: formData.fullName,
        email: formData.email,
        course_id: formData.courseId,
      },
      created_at: new Date().toISOString(),
    });

    setSubmitting(false);
    alert('Application submitted successfully. It has been sent for approval.');
    navigate('/app/students/approval');
  };

  async function checkDuplicateStudent() {
    const { data: existingByIc } = await supabase
      .from('students')
      .select('id')
      .eq('ic_passport', formData.icPassport.trim())
      .maybeSingle();

    if (existingByIc) {
      alert('A student with this IC/Passport already exists.');
      return true;
    }

    const { data: existingByEmail } = await supabase
      .from('students')
      .select('id')
      .eq('email', formData.email.trim())
      .maybeSingle();

    if (existingByEmail) {
      alert('A student with this email already exists.');
      return true;
    }

    return false;
  }

  async function uploadIcDocument(studentId: string) {
    if (!icFile) return '';

    const ext = icFile.name.split('.').pop();
    const filePath = `${studentId}/ic-passport-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('student-documents')
      .upload(filePath, icFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      alert(`Failed to upload IC/Passport: ${error.message}`);
      return '';
    }

    const { data } = supabase.storage
      .from('student-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function uploadSignature(studentId: string) {
    if (!signatureRef.current) return '';

    const canvas = signatureRef.current.getCanvas();
    const signatureDataUrl = canvas.toDataURL('image/png');

    const signatureBlob = dataUrlToBlob(signatureDataUrl);
    const filePath = `${studentId}/signature-${Date.now()}.png`;

    const { error } = await supabase.storage
      .from('student-signatures')
      .upload(filePath, signatureBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      alert(`Failed to upload signature: ${error.message}`);
      return '';
    }

    const { data } = supabase.storage
      .from('student-signatures')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  function dataUrlToBlob(dataUrl: string) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
        <p className="text-[#6b6b6b] mt-1">
          Register a new student for JEP Academy
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder="As per IC/Passport"
              full
            />

            <TextInput
              label="IC / Passport Number"
              name="icPassport"
              value={formData.icPassport}
              onChange={handleChange}
              required
              placeholder="123456-12-1234"
            />

            <TextInput
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+60 12-345 6789"
            />

            <TextInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="student@email.com"
              full
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Course Selection</h2>

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              {courses.length === 0 && <option value="">No course available</option>}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Emergency Contact</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="Emergency Contact Number"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              required
              placeholder="+60 12-345 6789"
            />

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

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Background Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Makeup Experience
              </label>
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
              <label className="block text-sm text-[#284342] mb-2">
                Health Conditions / Allergies
              </label>
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
              <label className="block text-sm text-[#284342] mb-2">
                Preferred Language
              </label>
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

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">Document Upload</h2>

          <div className="border-2 border-dashed border-[rgba(40,67,66,0.2)] rounded-lg p-8 text-center hover:border-[#e9da95] transition-colors">
            <Upload size={48} className="mx-auto text-[#6b6b6b] mb-4" />
            <p className="text-sm text-[#284342] mb-2">
              Upload IC/Passport Copy <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-[#6b6b6b] mb-4">
              PDF, JPG, or PNG. Max 5MB.
            </p>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="ic-upload"
              onChange={(e) => setIcFile(e.target.files?.[0] || null)}
            />

            <label
              htmlFor="ic-upload"
              className="inline-block px-6 py-2 bg-[#f8f8f6] text-[#284342] rounded-lg hover:bg-[#e9da95]/20 transition-colors cursor-pointer"
            >
              Choose File
            </label>

            {icFile && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#284342]">
                <span>{icFile.name}</span>
                <button type="button" onClick={() => setIcFile(null)}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

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
                  I have read and agree to the terms and conditions{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            <div className="border border-[rgba(40,67,66,0.1)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-[#284342]">
                  Digital Signature <span className="text-red-500">*</span>
                </p>
                <button
                  type="button"
                  onClick={() => signatureRef.current?.clear()}
                  className="text-sm text-[#d4183d] hover:underline"
                >
                  Clear
                </button>
              </div>

              <div className="border-2 border-dashed border-[rgba(40,67,66,0.2)] rounded-lg bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="#284342"
                  canvasProps={{
                    width: 760,
                    height: 180,
                    className: 'w-full h-44 rounded-lg',
                  }}
                />
              </div>

              <p className="text-xs text-[#6b6b6b] mt-2">
                Draw your signature using mouse, trackpad, or touch screen.
              </p>
            </div>
          </div>
        </div>

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
            disabled={submitting}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = '',
  type = 'text',
  full = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-sm text-[#284342] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
      />
    </div>
  );
}