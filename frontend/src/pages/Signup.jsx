import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import universityBg from '../assets/university-bg.jpg';
import { getDefaultRouteForRole } from '../utils/roleRedirect';
import { User, Mail, Phone, Lock, UserPlus, ArrowRight, CheckCircle2, XCircle, Info, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

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
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // Derive errors and password strength during render
  const getValidationErrors = (data) => {
    const newErrors = {};

    // First Name
    if (data.firstName) {
      if (!/^[A-Za-z]+$/.test(data.firstName)) {
        newErrors.firstName = "Name must contain only letters";
      } else if (data.firstName.length < 2) {
        newErrors.firstName = "Minimum 2 characters required";
      }
    }

    // Last Name
    if (data.lastName) {
      if (!/^[A-Za-z]+$/.test(data.lastName)) {
        newErrors.lastName = "Name must contain only letters";
      } else if (data.lastName.length < 2) {
        newErrors.lastName = "Minimum 2 characters required";
      }
    }

    // Email
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        newErrors.email = "Enter a valid email address";
      } else if (!data.email.endsWith('@winfall.edu')) {
        newErrors.email = "Use your university email (@winfall.edu)";
      }
    }

    // Phone Number
    if (data.phoneNumber) {
      if (!/^\d+$/.test(data.phoneNumber)) {
        newErrors.phoneNumber = "Only digits allowed";
      } else if (data.phoneNumber.length !== 10) {
        newErrors.phoneNumber = "Enter a valid phone number (10 digits)";
      }
    }

    // Password
    if (data.password) {
      if (data.password.length < 8 || 
          !/[A-Z]/.test(data.password) || 
          !/[a-z]/.test(data.password) || 
          !/[0-9]/.test(data.password) || 
          !/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) {
        newErrors.password = "Password must meet all requirements";
      }
    }

    // Confirm Password
    if (data.confirmPassword) {
      if (data.confirmPassword !== data.password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    return newErrors;
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'Weak', color: 'bg-red-500', icon: <ShieldAlert className="w-4 h-4" /> };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', icon: <ShieldAlert className="w-4 h-4" /> };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500', icon: <ShieldQuestion className="w-4 h-4" /> };
    return { score, label: 'Strong', color: 'bg-green-500', icon: <ShieldCheck className="w-4 h-4" /> };
  };

  const errors = getValidationErrors(formData);
  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateFormOnSubmit = () => {
    const submitErrors = { ...errors };
    
    if (!formData.firstName.trim()) submitErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) submitErrors.lastName = "Last name is required";
    if (!formData.email.trim()) submitErrors.email = "Email is required";
    if (!formData.phoneNumber.trim()) submitErrors.phoneNumber = "Phone number is required";
    if (!formData.password) submitErrors.password = "Password is required";
    if (!formData.confirmPassword) submitErrors.confirmPassword = "Confirm password is required";

    // Mark all as touched to show errors
    const allTouched = {};
    Object.keys(formData).forEach(key => allTouched[key] = true);
    setTouched(allTouched);

    return Object.keys(submitErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateFormOnSubmit()) return;

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
    } finally {
      setLoading(false);
    }
  };

  const renderFieldError = (fieldName) => {
    if (touched[fieldName] && errors[fieldName]) {
      return (
        <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          <XCircle className="w-3.5 h-3.5" />
          <span>{errors[fieldName]}</span>
        </div>
      );
    }
    return null;
  };

  const getInputClass = (fieldName) => {
    const baseClass = "block w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-2xl text-white placeholder-white/30 focus:outline-none transition-all text-sm";
    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClass} border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50`;
    }
    if (touched[fieldName] && !errors[fieldName] && formData[fieldName]) {
      return `${baseClass} border-green-500/50 focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50`;
    }
    return `${baseClass} border-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50`;
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12"
      style={{ backgroundImage: `url(${universityBg})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-xl">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-2">
                <img src={campusLogo} alt="Logo" className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
              <p className="text-blue-100/80 text-sm">Join the Winterfall Northern University community</p>
            </div>

            {authError && (
              <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-md rounded-xl p-4 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-100 text-sm font-medium">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${touched.firstName && errors.firstName ? 'text-red-400' : 'text-white/40 group-focus-within:text-blue-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={loading}
                      className={getInputClass('firstName')}
                      placeholder="First Name"
                    />
                  </div>
                  {renderFieldError('firstName')}
                </div>

                <div className="space-y-1">
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${touched.lastName && errors.lastName ? 'text-red-400' : 'text-white/40 group-focus-within:text-blue-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={loading}
                      className={getInputClass('lastName')}
                      placeholder="Last Name"
                    />
                  </div>
                  {renderFieldError('lastName')}
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${touched.email && errors.email ? 'text-red-400' : 'text-white/40 group-focus-within:text-blue-400'}`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    className={getInputClass('email')}
                    placeholder="University Email (@winfall.edu)"
                  />
                </div>
                {renderFieldError('email')}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${touched.phoneNumber && errors.phoneNumber ? 'text-red-400' : 'text-white/40 group-focus-within:text-blue-400'}`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    className={getInputClass('phoneNumber')}
                    placeholder="Phone Number (10 digits)"
                  />
                </div>
                {renderFieldError('phoneNumber')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${touched.password && errors.password ? 'text-red-400' : 'text-white/40 group-focus-within:text-blue-400'}`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={loading}
                      className={getInputClass('password')}
                      placeholder="Password"
                    />
                  </div>
                  {renderFieldError('password')}
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`${passwordStrength.color.replace('bg-', 'text-')} flex items-center gap-1`}>
                            {passwordStrength.icon}
                            <span className="text-[10px] font-bold uppercase tracking-wider">{passwordStrength.label}</span>
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                              key={i} 
                              className={`h-1 w-6 rounded-full transition-all duration-500 ${i <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-1">
                        <Requirement met={formData.password.length >= 8} label="8+ characters" />
                        <Requirement met={/[A-Z]/.test(formData.password)} label="Uppercase" />
                        <Requirement met={/[a-z]/.test(formData.password)} label="Lowercase" />
                        <Requirement met={/[0-9]/.test(formData.password)} label="Number" />
                        <Requirement met={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)} label="Special char" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${touched.confirmPassword && errors.confirmPassword ? 'text-red-400' : 'text-white/40 group-focus-within:text-blue-400'}`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={loading}
                      className={getInputClass('confirmPassword')}
                      placeholder="Confirm Password"
                    />
                  </div>
                  {renderFieldError('confirmPassword')}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="group relative flex w-full justify-center items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:hover:scale-100 mt-4"
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

            <div className="text-center pt-2">
              <p className="text-sm text-blue-100/60">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-white hover:text-blue-300 transition-colors underline underline-offset-4 decoration-white/20">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/30 uppercase tracking-[0.2em]">
          ┬© 2024 Winterfall Northern University
        </p>
      </div>
    </div>
  );
}

function Requirement({ met, label }) {
  return (
    <div className="flex items-center gap-1">
      {met ? (
        <CheckCircle2 className="w-3 h-3 text-green-400" />
      ) : (
        <div className="w-3 h-3 rounded-full border border-white/20" />
      )}
      <span className={`text-[10px] ${met ? 'text-green-400' : 'text-white/40'}`}>{label}</span>
    </div>
  );
}
