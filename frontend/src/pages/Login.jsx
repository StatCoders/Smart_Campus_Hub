import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/useAuth';
import authService from '../services/authService';
import campusLogo from '../assets/campus-logo.png';
import { getDefaultRouteForRole } from '../utils/roleRedirect';

const roleOptions = [
  {
    id: 'student-staff',
    role: 'USER',
    title: 'Student / Staff',
    description: 'Book resources and report issues',
    accent: 'from-cyan-500 to-teal-500',
  },
  {
    id: 'administrator',
    role: 'ADMIN',
    title: 'Administrator',
    description: 'Manage campus operations',
    accent: 'from-rose-500 to-orange-500',
  },
  {
    id: 'technician',
    role: 'TECHNICIAN',
    title: 'Technician',
    description: 'Handle maintenance tickets',
    accent: 'from-indigo-500 to-blue-500',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, error: authError, isAuthenticated, setAuthenticatedUser, user } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const selectedRoleMeta = roleOptions.find((option) => option.role === selectedRole);

  useEffect(() => {
    if (!isAuthenticated || hasRedirected) return;

    const postLoginRedirect = sessionStorage.getItem('postLoginRedirect');
    if (postLoginRedirect === 'google-success') {
      sessionStorage.removeItem('postLoginRedirect');
      setHasRedirected(true);
      navigate('/google-success', { replace: true });
      return;
    }

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

        sessionStorage.setItem('postLoginRedirect', 'google-success');
        navigate('/google-success', { replace: true });
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
    <div className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl">
        {!selectedRole ? (
          <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-8">
            <div className="space-y-2">
              <img src={campusLogo} alt="Winterfall Northern University" className="mx-auto mb-4 h-24 w-24" />
              <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Winterfall Northern University</p>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
              <p className="text-lg text-slate-600">Sign in to manage your campus operations</p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => googleSignIn()}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-lg font-semibold text-slate-900 transition hover:bg-white hover:shadow-sm disabled:bg-slate-100"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">G</span>
              Continue with Google
            </button>

            <div className="flex items-center gap-4 text-slate-500">
              <div className="h-px flex-1 bg-slate-300" />
              <span className="text-sm">Or sign in as a role</span>
              <div className="h-px flex-1 bg-slate-300" />
            </div>

            <div className="grid gap-3">
              {roleOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(option.role);
                    setError('');
                  }}
                  className="group w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-8 w-1.5 rounded-full bg-gradient-to-b ${option.accent}`} />
                      <div>
                        <p className="text-xl font-semibold text-slate-900">{option.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{option.description}</p>
                      </div>
                    </div>
                    <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600">&gt;</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="pt-1 text-center text-sm text-slate-600">
              Do not have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        ) : (
          <form
            className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold text-slate-900">
                Sign in as {selectedRoleMeta?.title || selectedRole}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setError('');
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Back
              </button>
            </div>

            <p className="text-sm text-slate-600">Enter your credentials to continue.</p>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Email address"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:bg-slate-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Do not have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
