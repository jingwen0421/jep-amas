import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const navigate = useNavigate();

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
      alert('Invalid email or password.');
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
      alert('No matching account profile was found. Contact Admin.');
      return;
    }

    if (profile.status === 'pending') {
      setLoading(false);
      await supabase.auth.signOut();
      alert('Your account is pending admin approval.');
      return;
    }

    if (profile.status === 'rejected') {
      setLoading(false);
      await supabase.auth.signOut();
      alert('Your account registration has been rejected.');
      return;
    }

    if (profile.status !== 'active') {
      setLoading(false);
      await supabase.auth.signOut();
      alert('Your account is inactive.');
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
        "Please fill in all fields."
      );

    }


    if(password.length < 8){

      throw new Error(
        "Password must be at least 8 characters."
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
        "Auth account creation failed."
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
      "Account submitted. Waiting for admin approval."
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
              JEP Image Makeup Academy
            </h1>
            <p className="text-[#6b6b6b]">
              Academy Management & Administration System
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
              Sign In
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
              Sign Up
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm mb-2 text-[#284342]">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 text-[#284342]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#284342]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                required
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm mb-2 text-[#284342]">Register As</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="assistant_teacher">Assistant Teacher</option>
                  <option value="finance">Finance Staff</option>
                  <option value="internal_sales">Internal Sales</option>
                  <option value="external_sales">External Sales</option>
                  <option value="parent">Parent / Guardian</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {mode === 'signup' && role === 'student' && (
              <div className="p-3 rounded-lg bg-[#e9da95]/20 text-sm text-[#284342]">
                Student sign-up will continue to the student registration form.
              </div>
            )}

            {mode === 'signup' && role !== 'student' && (
              <div className="p-3 rounded-lg bg-[#e9da95]/20 text-sm text-[#284342]">
                Staff accounts require admin approval before login.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : role === 'student'
                ? 'Continue Registration'
                : 'Submit for Approval'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-[#6b6b6b]">
          © 2026 JEP Image Makeup Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
