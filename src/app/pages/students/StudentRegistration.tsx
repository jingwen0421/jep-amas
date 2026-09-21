import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router';
import { Upload, X } from 'lucide-react';
import { notifyStudentRegistrationSubmitted } from '../../services/systemNotificationService';
import { getCurrentUser } from '../../utils/session';
import { useLanguage } from '../../context/LanguageContext';

interface Course {
  id: string;
  course_name: string;
}

export default function StudentRegistration() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const currentUser = getCurrentUser();
  const isLoggedIn = !!currentUser.id;

  const signupUserId = localStorage.getItem('studentSignupUserId') || '';
  const signupName = localStorage.getItem('studentSignupName') || '';
  const signupEmail = localStorage.getItem('studentSignupEmail') || '';

  // A staff member's active session always wins over a stale/leftover
  // self-signup key from a previous, unrelated signup on this browser.
  const isSignupFlow = !!signupUserId && !isLoggedIn;
  const isAdminFlow = !isSignupFlow;

  useEffect(() => {
    if (isLoggedIn && signupUserId) {
      localStorage.removeItem('studentSignupUserId');
      localStorage.removeItem('studentSignupName');
      localStorage.removeItem('studentSignupEmail');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [icFile, setIcFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: isSignupFlow ? signupName : '',
    icPassport: '',
    phone: '',
    email: isSignupFlow ? signupEmail : '',
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
      alert(t('students.registration.error.loadCoursesFailed', { error: error.message }));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      alert(t('students.registration.error.fullNameRequired'));
      return;
    }

    if (!formData.email.trim()) {
      alert(t('students.registration.error.emailRequired'));
      return;
    }

    if (!formData.courseId) {
      alert(t('students.registration.error.courseRequired'));
      return;
    }

    if (!isAdminFlow && !icFile) {
      alert(t('students.registration.error.icRequired'));
      return;
    }

    if (
      !isAdminFlow &&
      (!signatureRef.current || signatureRef.current.isEmpty())
    ) {
      alert(t('students.registration.error.signatureRequired'));
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
        user_id: signupUserId || null,
        student_code: studentCode,
        full_name: formData.fullName.trim(),
        ic_passport: formData.icPassport.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        emergency_contact_phone: formData.emergencyContact.trim(),
        emergency_contact_name: formData.emergencyRelation,
        makeup_experience: formData.makeupExperience,
        health_condition: formData.healthConditions,
        status: isAdminFlow ? 'active' : 'inactive',
        progress: 0,
        enroll_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();

    if (studentError || !newStudent) {
      setSubmitting(false);
      alert(t('students.registration.error.submitFailed', { error: studentError?.message || '' }));
      return;
    }

    const hasSignature =
      !!signatureRef.current && !signatureRef.current.isEmpty();

    const icUrl = icFile ? await uploadIcDocument(newStudent.id) : '';

    if (icFile && !icUrl) {
      setSubmitting(false);
      return;
    }

    const signatureUrl = hasSignature
      ? await uploadSignature(newStudent.id)
      : '';

    if (hasSignature && !signatureUrl) {
      setSubmitting(false);
      return;
    }

    if (icUrl || signatureUrl) {
      const { error: updateStudentError } = await supabase
        .from('students')
        .update({
          ...(icUrl ? { ic_document_url: icUrl } : {}),
          ...(signatureUrl ? { signature_url: signatureUrl } : {}),
        })
        .eq('id', newStudent.id);

      if (updateStudentError) {
        setSubmitting(false);
        alert(
          t('students.registration.error.documentUrlFailed', { error: updateStudentError.message })
        );
        return;
      }

      const docsToInsert = [
        icUrl
          ? {
              student_id: newStudent.id,
              document_type: 'IC Copy',
              file_url: icUrl,
              uploaded_by: null,
              uploaded_at: new Date().toISOString(),
            }
          : null,
        signatureUrl
          ? {
              student_id: newStudent.id,
              document_type: 'Digital Signature',
              file_url: signatureUrl,
              uploaded_by: null,
              uploaded_at: new Date().toISOString(),
            }
          : null,
      ].filter((doc) => doc !== null);

      const { error: docsError } = await supabase
        .from('documents')
        .insert(docsToInsert);

      if (docsError) {
        setSubmitting(false);
        alert(t('students.registration.error.documentRecordFailed', { error: docsError.message }));
        return;
      }
    }

    const { error: applicationError } = await supabase
      .from('registration_applications')
      .insert({
        student_id: newStudent.id,
        course_id: formData.courseId,
        application_status: isAdminFlow ? 'approved' : 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: isAdminFlow ? new Date().toISOString() : null,
      });

    if (applicationError) {
      setSubmitting(false);
      alert(
        t('students.registration.error.registrationRecordFailed', { error: applicationError.message })
      );
      return;
    }

    await notifyStudentRegistrationSubmitted(formData.fullName.trim(), {
      userId: signupUserId || null,
    });

    await supabase.from('audit_logs').insert({
      user_id: signupUserId || null,
      action: 'Student Registration Submitted',
      module: 'Student Registration',
      target_id: newStudent.id,
      old_data: null,
      new_data: {
        student_name: formData.fullName,
        email: formData.email,
        course_id: formData.courseId,
        user_id: signupUserId || null,
      },
      created_at: new Date().toISOString(),
    });

    localStorage.removeItem('studentSignupUserId');
    localStorage.removeItem('studentSignupName');
    localStorage.removeItem('studentSignupEmail');

    setSubmitting(false);

    alert(
      isSignupFlow
        ? t('students.registration.successSignup')
        : t('students.registration.successAdmin')
    );

    navigate('/');
  }

  async function checkDuplicateStudent() {
    const { data: existingByIc } = await supabase
      .from('students')
      .select('id')
      .eq('ic_passport', formData.icPassport.trim())
      .maybeSingle();

    if (existingByIc) {
      alert(t('students.registration.error.duplicateIc'));
      return true;
    }

    const { data: existingByEmail } = await supabase
      .from('students')
      .select('id')
      .eq('email', formData.email.trim())
      .maybeSingle();

    if (existingByEmail) {
      alert(t('students.registration.error.duplicateEmail'));
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
      alert(t('students.registration.error.uploadIcFailed', { error: error.message }));
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
      alert(t('students.registration.error.uploadSignatureFailed', { error: error.message }));
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

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('students.registration.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {isSignupFlow
            ? t('students.registration.subtitleSignup')
            : t('students.registration.subtitleAdmin')}
        </p>
      </div>

      {isSignupFlow && (
        <div className="bg-[#e9da95]/20 border border-[#e9da95] rounded-xl p-4 text-sm text-[#284342]">
          {t('students.registration.signupNote')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">
            {t('students.registration.section.personalInfo')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label={t('students.registration.field.fullName')}
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder={t('students.registration.field.fullNamePlaceholder')}
              full
              disabled={isSignupFlow && !!signupName}
            />

            <TextInput
              label={t('students.registration.field.icPassport')}
              name="icPassport"
              value={formData.icPassport}
              onChange={handleChange}
              required
              placeholder={t('students.registration.field.icPassportPlaceholder')}
            />

            <TextInput
              label={t('students.registration.field.phone')}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder={t('students.registration.field.phonePlaceholder')}
            />

            <TextInput
              label={t('students.registration.field.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('students.registration.field.emailPlaceholder')}
              full
              disabled={isSignupFlow && !!signupEmail}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">{t('students.registration.section.courseSelection')}</h2>

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              {t('students.registration.field.course')} <span className="text-red-500">*</span>
            </label>

            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              {courses.length === 0 && (
                <option value="">{t('students.registration.noCoursesAvailable')}</option>
              )}

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">{t('students.registration.section.emergencyContact')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label={t('students.registration.field.emergencyContact')}
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              required
              placeholder={t('students.registration.field.phonePlaceholder')}
            />

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                {t('students.registration.field.relationship')} <span className="text-red-500">*</span>
              </label>

              <select
                name="emergencyRelation"
                value={formData.emergencyRelation}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="">{t('students.registration.field.selectRelationship')}</option>
                <option value="Parent">{t('students.registration.relationship.parent')}</option>
                <option value="Spouse">{t('students.registration.relationship.spouse')}</option>
                <option value="Sibling">{t('students.registration.relationship.sibling')}</option>
                <option value="Friend">{t('students.registration.relationship.friend')}</option>
                <option value="Other">{t('students.registration.relationship.other')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">
            {t('students.registration.section.backgroundInfo')}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                {t('students.registration.field.makeupExperience')}
              </label>

              <select
                name="makeupExperience"
                value={formData.makeupExperience}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="">{t('students.registration.field.selectExperienceLevel')}</option>
                <option value="Beginner">{t('students.registration.experience.beginner')}</option>
                <option value="Some Experience">
                  {t('students.registration.experience.someExperience')}
                </option>
                <option value="Intermediate">{t('students.registration.experience.intermediate')}</option>
                <option value="Advanced">{t('students.registration.experience.advanced')}</option>
                <option value="Professional">{t('students.registration.experience.professional')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                {t('students.registration.field.healthConditions')}
              </label>

              <textarea
                name="healthConditions"
                value={formData.healthConditions}
                onChange={handleChange}
                placeholder={t('students.registration.field.healthConditionsPlaceholder')}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#284342] mb-2">
                {t('students.registration.field.preferredLanguage')}
              </label>

              <select
                name="languagePreference"
                value={formData.languagePreference}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="English">{t('students.registration.language.english')}</option>
                <option value="Chinese">{t('students.registration.language.chinese')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-6">{t('students.registration.section.documentUpload')}</h2>

          <div className="border-2 border-dashed border-[rgba(40,67,66,0.2)] rounded-lg p-8 text-center hover:border-[#e9da95] transition-colors">
            <Upload size={48} className="mx-auto text-[#6b6b6b] mb-4" />
            <p className="text-sm text-[#284342] mb-2">
              {t('students.registration.uploadIc')}{' '}
              {isAdminFlow ? (
                <span className="text-[#6b6b6b] text-xs">{t('students.registration.optional')}</span>
              ) : (
                <span className="text-red-500">*</span>
              )}
            </p>
            <p className="text-xs text-[#6b6b6b] mb-4">
              {t('students.registration.uploadHint')}
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
              {t('students.registration.chooseFile')}
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
          <h2 className="text-xl text-[#284342] mb-6">
            {t('students.registration.section.consent')}
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-[#f8f8f6] rounded-lg">
              <p className="text-sm text-[#6b6b6b] mb-4">
                {t('students.registration.pdpaText')}
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="pdpaConsent"
                  checked={formData.pdpaConsent}
                  onChange={handleChange}
                  required={!isAdminFlow}
                  className="mt-1 w-5 h-5 rounded border-[rgba(40,67,66,0.2)] text-[#284342] focus:ring-2 focus:ring-[#284342]"
                />

                <span className="text-sm text-[#284342]">
                  {t('students.registration.agreeTerms')}{' '}
                  {isAdminFlow ? (
                    <span className="text-[#6b6b6b] text-xs">{t('students.registration.optional')}</span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </span>
              </label>
            </div>

            <div className="border border-[rgba(40,67,66,0.1)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-[#284342]">
                  {t('students.registration.digitalSignature')}{' '}
                  {isAdminFlow ? (
                    <span className="text-[#6b6b6b] text-xs">{t('students.registration.optional')}</span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => signatureRef.current?.clear()}
                  className="text-sm text-[#d4183d] hover:underline"
                >
                  {t('students.registration.clear')}
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
                {t('students.registration.signatureHint')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(isSignupFlow ? '/' : '/app/students/list')}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            {t('students.registration.cancel')}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-60"
          >
            {submitting ? t('students.registration.submitting') : t('students.registration.submit')}
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
  disabled = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  full?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342] disabled:bg-[#f8f8f6] disabled:text-[#6b6b6b]"
      />
    </div>
  );
}
