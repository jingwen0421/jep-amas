import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../../imports/501660136_122109878822875527_8989073406723948038_n.jpg';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8f8f6' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="Beauty Academy" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="mb-2" style={{ color: '#284342' }}>Beauty Academy</h1>
          <p style={{ color: '#6b6b6b' }}>Academic Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="mb-6 text-center" style={{ color: '#284342' }}>Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-2" style={{ color: '#284342' }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
                style={{ background: '#ffffff', borderColor: 'rgba(40, 67, 66, 0.2)' }}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color: '#284342' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
                  style={{ background: '#ffffff', borderColor: 'rgba(40, 67, 66, 0.2)' }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#6b6b6b' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" style={{ accentColor: '#284342' }} />
                <span style={{ color: '#6b6b6b' }}>Remember me</span>
              </label>
              <a href="#" style={{ color: '#284342' }} className="hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: '#284342', color: '#e9da95' }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: '#6b6b6b' }}>
              Don't have an account?{' '}
              <a href="#" style={{ color: '#284342' }} className="hover:underline">
                Contact Admin
              </a>
            </p>
          </div>
        </div>

        <p className="text-center mt-6" style={{ color: '#6b6b6b' }}>
          © 2026 Beauty Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
