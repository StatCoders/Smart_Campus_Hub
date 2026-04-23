import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import universityBg from '../assets/university-bg.jpg';
import { getDefaultRouteForRole } from '../utils/roleRedirect';
import { User, Mail, Phone, Lock, UserPlus, ArrowRight } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!/^\d{10,}$/.test(formData.phoneNumber.trim())) {
      setError('Phone number must be at least 10 digits');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      const signupData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };
      
      const authenticatedUser = await signup(signupData);
      navigate(getDefaultRouteForRole(authenticatedUser?.role), { replace: true });
    } catch (err) {
      console.error('Signup error:', err);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        const validationErrors = err.response?.data?.data;
        if (validationErrors && typeof validationErrors === 'object') {
          const firstFieldError = Object.values(validationErrors)[0];
          if (firstFieldError) {
            errorMessage = String(firstFieldError);
          }
        }
      } else if (err.response?.status === 409) {
        errorMessage = 'This email is already registered.';
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

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12"
      style={{ backgroundImage: `url(${universityBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-xl">
        {/* Glassmorphic Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden">
          {/* Top subtle glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-2">
                <img src={campusLogo} alt="Logo" className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
              <p className="text-blue-100/80 text-sm">Join the Winterfall Northern University community</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-md rounded-xl p-4 text-center">
                <p className="text-red-100 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                    placeholder="First Name"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
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
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                  placeholder="Phone Number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
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

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                    placeholder="Confirm Password"
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
                    Creating account...
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Sign Up
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-blue-100/60">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-white hover:text-blue-300 transition-colors">
                  Sign in here
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
