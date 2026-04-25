import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Edit2, 
  Save, 
  X, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import authService from '../services/authService';
import { normalizeRole } from '../utils/roleRedirect';
import TechnicianMaintenanceSidebar from '../components/TechnicianMaintenanceSidebar';

export default function Profile() {
  const { user, setAuthenticatedUser } = useAuth();
  const { isCollapsed } = useSidebar();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'USER'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'USER'
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber
      });

      if (response.success) {
        // Update user context
        setAuthenticatedUser({
          ...user,
          firstName: response.firstName,
          lastName: response.lastName,
          fullName: `${response.firstName} ${response.lastName}`,
          phoneNumber: response.phoneNumber
        });
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile.' });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'An error occurred while updating profile.' });
    } finally {
      setLoading(false);
    }
  };

  const role = normalizeRole(user?.role);
  const isStudent = role === 'USER';
  const isAdmin = role === 'ADMIN';
  const isTechnician = role === 'TECHNICIAN';

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans antialiased text-slate-900">
      {isAdmin && <Sidebar activeTab="profile" setActiveTab={() => {}} />}
      {isTechnician && <TechnicianMaintenanceSidebar activeTab="profile" setActiveTab={() => {}} />}
      
      <div className={`flex-1 transition-all duration-300 ${isStudent ? 'ml-0' : (isCollapsed ? 'lg:ml-24' : 'lg:ml-64')}`}>
        <TopBar user={user} />
        
        <main className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Profile</h1>
              <p className="text-slate-500 mt-1">Manage your account information and preferences.</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-200"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-200"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Success/Error Message */}
          {message.text && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-3xl font-bold border border-white/20">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                      {user?.role || 'USER'}
                    </span>
                    <span className="text-slate-400 text-sm">• Account Holder</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                      isEditing 
                        ? 'bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5' 
                        : 'bg-slate-50 border-transparent text-slate-500 cursor-default'
                    }`}
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                      isEditing 
                        ? 'bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5' 
                        : 'bg-slate-50 border-transparent text-slate-500 cursor-default'
                    }`}
                  />
                </div>

                {/* Email (Read-only always) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-transparent bg-slate-50 text-slate-500 cursor-default"
                  />
                  <p className="text-[10px] text-slate-400 font-medium italic">* Email cannot be changed for security reasons.</p>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="Enter phone number"
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                      isEditing 
                        ? 'bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5' 
                        : 'bg-slate-50 border-transparent text-slate-500 cursor-default'
                    }`}
                  />
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-400" />
                    Account Role
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl border border-transparent bg-slate-50 flex items-center justify-between">
                    <span className="text-slate-500 font-medium uppercase tracking-wide text-sm">{formData.role}</span>
                    <Shield className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
