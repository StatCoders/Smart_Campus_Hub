import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/useAuth';
import authService from '../services/authService';
import campusLogo from '../assets/campus-logo.png';
import universityBg from '../assets/university-bg.jpg';
import { getDefaultRouteForRole } from '../utils/roleRedirect';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, error: authError, isAuthenticated, setAuthenticatedUser, user } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || hasRedirected) return;

    const redirectPath = getDefaultRouteForRole(user?.role);
    setHasRedirected(true);
    navigate(redirectPath, { replace: true });
  }, [isAuthenticated, navigate, user?.role, hasRedirected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = await login(formData.email.trim().toLowerCase(), formData.password);
      const redirectPath = getDefaultRouteForRole(authenticatedUser?.role);

      setHasRedirected(true);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid input. Please check your information.';
      } else if (authError) {
        errorMessage = authError;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');

        const response = await authService.googleLogin(tokenResponse.access_token);

        localStorage.setItem('accessToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        setAuthenticatedUser(response);

        const redirectPath = getDefaultRouteForRole(response?.role);
        navigate(redirectPath, { replace: true });
      } catch (err) {
        let errorMessage = 'Google login failed. Please try again.';

        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 400) {
          errorMessage = 'Invalid Google token';
        } else if (err.message === 'Network Error') {
          errorMessage = 'Network error. Please check your connection.';
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed');
    },
  });

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed px-4"
      style={{ backgroundImage: `url(${universityBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg">
        {/* Glassmorphic Login Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden">
          {/* Logo and Header */}
          <div className="text-center mb-10">
            <div className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4">
              <img src={campusLogo} alt="Logo" className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
            <p className="text-blue-100/80 mt-2">Sign in to your Winterfall Hub account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-md">
              <p className="text-sm text-red-100 text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-50 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-200/60 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                  placeholder="name@university.edu"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-blue-50">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-200/60 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-blue-100/60 backdrop-blur-xl">Or continue with</span>
            </div>
          </div>

          {/* Social Logins */}
          <button
            type="button"
            onClick={() => googleSignIn()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-blue-100/60">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white font-semibold hover:underline decoration-blue-400 underline-offset-4">
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex justify-center gap-6 text-xs text-blue-100/40 font-medium">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Help Center</a>
        </div>
      </div>
    </div>
  );
}
