import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('jingwen0421@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (email === 'jingwen0421@gmail.com' && password === '123') {
      localStorage.setItem('userRole', 'super_admin');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', 'Wong Jing Wen');
      setLoading(false);
      navigate('/app/dashboard');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('full_name, email, role, status')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      setLoading(false);
      alert('Invalid email or inactive account.');
      return;
    }

    if (password !== '123') {
      setLoading(false);
      alert('Invalid password.');
      return;
    }

    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userName', data.full_name);

    setLoading(false);
    navigate('/app/dashboard');
  };

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

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-[#284342]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
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
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-[#f8f8f6] text-sm text-[#6b6b6b]">
              Demo super admin: jingwen0421@gmail.com / 123
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
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