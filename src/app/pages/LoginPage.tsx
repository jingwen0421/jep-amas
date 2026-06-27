import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('jingwen0421@gmail.com');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (email === 'jingwen0421@gmail.com' && password === '123') {
      localStorage.setItem('userId', 'super-admin-demo');
      localStorage.setItem('userRole', 'super_admin');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', 'Wong Jing Wen');

      setLoading(false);
      navigate('/app/dashboard');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, status, password')
      .eq('email', email)
      .single();

    if (error || !data) {
      setLoading(false);
      alert('Invalid email or account not found.');
      return;
    }

    if (data.password !== password) {
      setLoading(false);
      alert('Invalid password.');
      return;
    }

    if (data.status === 'pending') {
      setLoading(false);
      alert('Your account is pending admin approval.');
      return;
    }

    if (data.status === 'rejected') {
      setLoading(false);
      alert('Your account registration has been rejected.');
      return;
    }

    if (data.status !== 'active') {
      setLoading(false);
      alert('Your account is inactive.');
      return;
    }

    localStorage.setItem('userId', data.id);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userName', data.full_name);

    await supabase.from('audit_logs').insert({
      user_id: data.id,
      action: 'Logged In',
      module: 'Authentication',
      target_id: data.id,
      old_data: null,
      new_data: {
        full_name: data.full_name,
        email: data.email,
        role: data.role,
      },
      created_at: new Date().toISOString(),
    });

    setLoading(false);
    navigate('/app/dashboard');
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!fullName.trim()) {
      alert('Please enter your full name.');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      alert('Please enter your email.');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      alert('Please enter your password.');
      setLoading(false);
      return;
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      alert('This email is already registered.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        full_name: fullName.trim(),
        email,
        password,
        role,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      alert(`Failed to submit registration: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data?.id) {
      alert('User account was created, but user ID was not returned.');
      setLoading(false);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: role === 'student' ? 'Student Signup Submitted' : 'Staff Signup Submitted',
      module: 'User Management',
      target_id: data.id,
      old_data: null,
      new_data: {
        full_name: fullName.trim(),
        email,
        role,
        status: 'pending',
      },
      created_at: new Date().toISOString(),
    });

    if (role === 'student') {
      localStorage.setItem('studentSignupUserId', data.id);
      localStorage.setItem('studentSignupName', fullName.trim());
      localStorage.setItem('studentSignupEmail', email);

      setLoading(false);
      navigate('/student-registration');
      return;
    }

    alert('Account request submitted. Please wait for admin approval.');

    setMode('login');
    setFullName('');
    setPassword('');
    setRole('student');
    setLoading(false);
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
                mode === 'login'
                  ? 'bg-[#284342] text-[#e9da95]'
                  : 'text-[#284342]'
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
                mode === 'signup'
                  ? 'bg-[#284342] text-[#e9da95]'
                  : 'text-[#284342]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form
            onSubmit={mode === 'login' ? handleLogin : handleSignup}
            className="space-y-5"
          >
            {mode === 'signup' && (
              <div>
                <label className="block text-sm mb-2 text-[#284342]">
                  Full Name
                </label>
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
              <label className="block text-sm mb-2 text-[#284342]">
                Email Address
              </label>
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
              <label className="block text-sm mb-2 text-[#284342]">
                Password
              </label>
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
                <label className="block text-sm mb-2 text-[#284342]">
                  Register As
                </label>
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

            {mode === 'login' && (
              <div className="p-3 rounded-lg bg-[#f8f8f6] text-sm text-[#6b6b6b]">
                Demo super admin: jingwen0421@gmail.com / 123
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