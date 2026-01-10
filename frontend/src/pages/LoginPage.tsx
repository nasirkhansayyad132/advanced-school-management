import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, School, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      login(response.accessToken, response.user);
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
          <p className="text-gray-500 mt-1">Sign in to continue</p>
        </div>

        {/* Network Status */}
        <div className={`flex items-center justify-center gap-2 mb-4 p-2 rounded-lg ${
          isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">Offline</span>
            </>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-12"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isOnline}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {!isOnline && (
            <p className="text-center text-sm text-yellow-600 mt-4">
              You need to be online to sign in
            </p>
          )}
        </form>

        {/* Demo credentials */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo: teacher@school.local / teacher123</p>
        </div>
      </div>
    </div>
  );
}
