import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/useAuth';
import authService from '../services/authService';
import campusLogo from '../assets/campus-logo.png';
import universityBg from '../assets/university-bg.jpg';
import { getDefaultRouteForRole } from '../utils/roleRedirect';
import { Mail, Lock, ArrowRight, Globe } from 'lucide-react';

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

        navigate('/home', { replace: true });
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
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4"
      style={{ backgroundImage: `url(${universityBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-md">
        {/* Glassmorphic Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden">
          {/* Top subtle glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-2">
                <img src={campusLogo} alt="Logo" className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
              <p className="text-blue-100/80 text-sm">Sign in to your campus account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-md rounded-xl p-4 text-center">
                <p className="text-red-100 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Google Login */}
            <button
              type="button"
              onClick={() => googleSignIn()}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <Globe className="w-5 h-5 text-blue-600" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Or login with email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                    placeholder="University Email"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-blue-100/60">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-white hover:text-blue-300 transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <p className="mt-8 text-center text-xs text-white/30 uppercase tracking-widest">
          ┬© 2024 Winterfall Northern University
        </p>
      </div>
    </div>
  );
}
