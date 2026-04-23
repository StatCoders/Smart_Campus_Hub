import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import universityBg from '../assets/university-bg.jpg';
import { getDefaultRouteForRole } from '../utils/roleRedirect';
import { UserPlus, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

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
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed px-4 py-12"
      style={{ backgroundImage: `url(${universityBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl">
        {/* Glassmorphic Signup Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4">
              <img src={campusLogo} alt="Logo" className="h-14 w-14" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
            <p className="text-blue-100/80 mt-2">Join the Winterfall Northern University community</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-md">
              <p className="text-sm text-red-100 text-center">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-50 ml-1">First Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-200/60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                    placeholder="John"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-50 ml-1">Last Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-200/60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                    placeholder="Doe"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
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
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                    placeholder="john@university.edu"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-50 ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-blue-200/60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                    placeholder="0771234567"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-50 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-200/60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-50 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-200/60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/20 transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-blue-600/20 mt-4"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-blue-100/60">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline decoration-blue-400 underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
