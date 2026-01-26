import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, School, Wifi, WifiOff, Lock, Mail, GraduationCap, Users, BarChart3, ClipboardCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import clsx from 'clsx';

const features = [
  { icon: ClipboardCheck, title: 'Smart Attendance', description: 'Track attendance with ease' },
  { icon: GraduationCap, title: 'Class Management', description: 'Organize classes efficiently' },
  { icon: Users, title: 'Student Tracking', description: 'Monitor student progress' },
  { icon: BarChart3, title: 'Real-time Reports', description: 'Insights at your fingertips' },
];

const demoAccounts = [
  { role: 'Admin', email: 'admin@school.local', password: 'admin123' },
  { role: 'Principal', email: 'principal@school.local', password: 'principal123' },
  { role: 'Teacher', email: 'john.smith@school.local', password: 'teacher123' },
];

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
      
      // Navigate based on role
      if (response.user.role === 'ADMIN' || response.user.role === 'PRINCIPAL') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <School className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SchoolSync</h1>
              <p className="text-blue-200">Advanced Management System</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Transform Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              School Management
            </span>
          </h2>
          
          <p className="text-lg text-blue-100 mb-12 max-w-lg">
            A comprehensive platform for managing students, teachers, attendance, and academic performance - all in one place.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-blue-200">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
              <School className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SchoolSync</h1>
            <p className="text-gray-500">Advanced Management System</p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-1">Sign in to your account</p>
            </div>

            {/* Network Status */}
            <div className={clsx(
              'flex items-center justify-center gap-2 mb-6 p-3 rounded-xl text-sm font-medium',
              isOnline 
                ? 'bg-green-50 text-green-700 border border-green-100' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
            )}>
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Connected to server</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>You're offline</span>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isOnline}
                className={clsx(
                  'w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                  'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
                  'shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg',
                  'transform hover:-translate-y-0.5 active:translate-y-0'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6">
            <p className="text-center text-sm text-gray-500 mb-3">Quick login with demo accounts:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoCredentials(account.email, account.password)}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600',
                    'shadow-sm hover:shadow'
                  )}
                >
                  {account.role}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            © 2024 SchoolSync. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
