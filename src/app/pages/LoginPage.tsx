import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setLoading(false);
      alert(t('login.error.invalidCredentials'));
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, full_name, email, role, status')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setLoading(false);
      await supabase.auth.signOut();
      alert(t('login.error.noProfile'));
      return;
    }

    if (profile.status === 'pending') {
      setLoading(false);
      await supabase.auth.signOut();
      alert(t('login.error.pending'));
      return;
    }

    if (profile.status === 'rejected') {
      setLoading(false);
      await supabase.auth.signOut();
      alert(t('login.error.rejected'));
      return;
    }

    if (profile.status !== 'active') {
      setLoading(false);
      await supabase.auth.signOut();
      alert(t('login.error.inactive'));
      return;
    }

    localStorage.setItem('userId', profile.id);
    localStorage.setItem('userRole', profile.role);
    localStorage.setItem('userEmail', profile.email);
    localStorage.setItem('userName', profile.full_name);

    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action: 'Logged In',
      module: 'Authentication',
      target_id: profile.id,
      old_data: null,
      new_data: {
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
      },
      created_at: new Date().toISOString(),
    });

    setLoading(false);
    navigate('/app/dashboard');
  }

async function handleSignup(e: React.FormEvent) {

  e.preventDefault();

  setLoading(true);


  try {


    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {

      throw new Error(
        t('login.error.fillAllFields')
      );

    }


    if(password.length < 8){

      throw new Error(
        t('login.error.passwordLength')
      );

    }



    // 1. CREATE AUTH USER

    const {
      data:authData,
      error:authError

    } = await supabase.auth.signUp({

      email,

      password,

      options:{
        data:{
          full_name:
          fullName.trim(),

          role
        }
      }

    });



    if(authError)
      throw authError;



    if(!authData.user)
      throw new Error(
        t('login.error.authFailed')
      );





    console.log(
      "Created auth user:",
      authData.user.id
    );





    // 2. CREATE PROFILE

    const {
      data:profile,
      error:profileError

    } = await supabase


    .from("users")


    .insert({

      auth_user_id:
      authData.user.id,


      full_name:
      fullName.trim(),


      email,


      role,


      status:
      "pending"


    })


    .select("id")


    .single();





    if(profileError){

      console.error(
        profileError
      );

      throw profileError;

    }






    // 3. AUDIT LOG

    await supabase
    .from("audit_logs")
    .insert({

      user_id:null,

      action:
      role==="student"
      ?
      "Student Signup Submitted"
      :
      "Staff Signup Submitted",


      module:
      "User Management",


      target_id:
      profile.id,


      new_data:{

        full_name:
        fullName.trim(),

        email,

        role,

        status:"pending"

      },


      created_at:
      new Date()
      .toISOString()

    });







    if(role==="student"){


      localStorage.setItem(
        "studentSignupUserId",
        profile.id
      );


      await supabase.auth.signOut();


      navigate(
        "/student-registration"
      );


      return;

    }





    alert(
      t('login.signupSubmitted')
    );


    setMode("login");

    setFullName("");

    setEmail("");

    setPassword("");

    setRole("student");



  }

  catch(error:any){


    console.error(
      "Signup error:",
      error
    );


    alert(
      error.message
    );


  }


  finally{

    setLoading(false);

  }

}

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[rgba(40,67,66,0.1)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl text-[#284342] mb-2">
              {t('login.title')}
            </h1>
            <p className="text-[#6b6b6b]">
              {t('login.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 bg-[#f8f8f6] rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 rounded-md text-sm ${
                mode === 'login' ? 'bg-[#284342] text-[#e9da95]' : 'text-[#284342]'
              }`}
            >
              {t('login.signIn')}
            </button>


            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setEmail('');
                setPassword('');
              }}
              className={`py-2 rounded-md text-sm ${
                mode === 'signup' ? 'bg-[#284342] text-[#e9da95]' : 'text-[#284342]'
              }`}
            >
              {t('login.signUp')}
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm mb-2 text-[#284342]">{t('login.fullName')}</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('login.fullNamePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 text-[#284342]">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#284342]">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.password')}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                required
              />
            </div>

            {/* Forgot Password */}

            {mode==="login" && (

            <div className="text-right">

            <button

            type="button"

            onClick={()=>navigate("/forgot-password")}

            className="
            text-sm
            text-[#284342]
            hover:underline
            "

            >

            {t('login.forgotPassword')}

            </button>

            </div>

            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm mb-2 text-[#284342]">{t('login.registerAs')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                >
                  <option value="student">{t('login.role.student')}</option>
                  <option value="teacher">{t('login.role.teacher')}</option>
                  <option value="assistant_teacher">{t('login.role.assistantTeacher')}</option>
                  <option value="finance">{t('login.role.finance')}</option>
                  <option value="internal_sales">{t('login.role.internalSales')}</option>
                  <option value="external_sales">{t('login.role.externalSales')}</option>
                  <option value="parent">{t('login.role.parent')}</option>
                  <option value="admin">{t('login.role.admin')}</option>
                </select>
              </div>
            )}

            {mode === 'signup' && role === 'student' && (
              <div className="p-3 rounded-lg bg-[#e9da95]/20 text-sm text-[#284342]">
                {t('login.studentSignupNote')}
              </div>
            )}

            {mode === 'signup' && role !== 'student' && (
              <div className="p-3 rounded-lg bg-[#e9da95]/20 text-sm text-[#284342]">
                {t('login.staffSignupNote')}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] disabled:opacity-50"
            >
              {loading
                ? t('common.processing')
                : mode === 'login'
                ? t('login.signIn')
                : role === 'student'
                ? t('login.continueRegistration')
                : t('login.submitForApproval')}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-[#6b6b6b]">
          {t('login.copyright')}
        </p>
      </div>
    </div>
  );
}
