import React, { useState, useEffect } from 'react';
import { X, Bell, Shield, Ticket, Check, Loader2, Save, Volume2, VolumeX } from 'lucide-react';
import { getPreferences, updatePreferences } from '../services/notificationService';

export default function NotificationSettingsModal({ userId, isOpen, onClose }) {
  const [preferences, setPreferences] = useState({
    bookingEnabled: true,
    ticketEnabled: true,
    systemEnabled: true,
    muteAll: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPreferences();
    }
  }, [isOpen, userId, fetchPreferences]);

  const fetchPreferences = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPreferences(userId);
      setPreferences(data);
    } catch (err) {
      setError('Failed to load preferences. Please try again.');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updatePreferences(userId, preferences);
      setSuccess(true);
      // Auto-close after 1.5 seconds to show success state
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-xl text-sky-600">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Notification Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-4" />
              <p className="text-sm font-medium">Loading your preferences...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl">
                  {error}
                </div>
              )}

              {/* Mute All Toggle */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${preferences.muteAll ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${preferences.muteAll ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600 shadow-sm'}`}>
                    {preferences.muteAll ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${preferences.muteAll ? 'text-white' : 'text-slate-900'}`}>Mute All</p>
                    <p className={`text-xs ${preferences.muteAll ? 'text-slate-400' : 'text-slate-500'}`}>Silence all notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('muteAll')}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${preferences.muteAll ? 'bg-sky-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.muteAll ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Preference Items */}
              <div className={`space-y-4 ${preferences.muteAll ? 'opacity-40 pointer-events-none' : ''}`}>
                <PreferenceItem 
                  icon={<Ticket className="h-5 w-5" />}
                  title="Booking Updates"
                  description="Status changes, approvals, and reminders"
                  enabled={preferences.bookingEnabled}
                  onToggle={() => handleToggle('bookingEnabled')}
                  disabled={saving}
                  color="sky"
                />
                <PreferenceItem 
                  icon={<Shield className="h-5 w-5" />}
                  title="Ticket & Maintenance"
                  description="New comments, priority changes, and resolutions"
                  enabled={preferences.ticketEnabled}
                  onToggle={() => handleToggle('ticketEnabled')}
                  disabled={saving}
                  color="indigo"
                />
                <PreferenceItem 
                  icon={<Bell className="h-5 w-5" />}
                  title="System Notifications"
                  description="Security alerts, role changes, and announcements"
                  enabled={preferences.systemEnabled}
                  onToggle={() => handleToggle('systemEnabled')}
                  disabled={saving}
                  color="slate"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                <div className="flex-1">
                  {success && (
                    <div className="flex items-center gap-1.5 text-emerald-600 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="p-0.5 bg-emerald-100 rounded-full">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-slate-200"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : success ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PreferenceItem({ icon, title, description, enabled, onToggle, disabled, color }) {
  const colors = {
    sky: 'bg-sky-50 text-sky-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    slate: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colors[color] || colors.slate}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-sky-500' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
