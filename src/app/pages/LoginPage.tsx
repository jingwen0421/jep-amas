import { useState } from 'react';
import { useNavigate } from 'react-router';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('userRole', role);
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[rgba(40,67,66,0.1)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl text-[#284342] mb-2">JEP Image Makeup Academy</h1>
            <p className="text-[#6b6b6b]">Academy Management & Administration System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-[#284342]">User Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="super-admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="finance">Finance Staff</option>
                <option value="owner">Academy Owner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#284342]">Email Address</label>
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
              <label className="block text-sm mb-2 text-[#284342]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-[#6b6b6b] hover:text-[#284342]">
              Forgot your password?
            </a>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-[#6b6b6b]">
          © 2026 JEP Image Makeup Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
