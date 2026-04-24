import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, Shield, BookOpen, Ticket, VolumeX, AlertTriangle, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { getPreferences, updatePreferences } from '../services/notificationService';

export default function NotificationSettingsModal({ userId, isOpen, onClose }) {
  const [preferences, setPreferences] = useState({
    bookingEnabled: true,
    ticketEnabled: true,
    systemEnabled: true,
    muteAll: false,
    highPriorityOnly: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchPreferences = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPreferences(userId);
      setPreferences(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPreferences();
    }
  }, [isOpen, userId, fetchPreferences]);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await updatePreferences(userId, preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:items-center animate-in fade-in duration-200">
      <div className="relative my-auto w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-8 py-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-sm">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Notification Settings</h3>
                <p className="text-xs font-medium text-slate-500">Manage how you receive updates</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto px-8 py-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-sky-500" />
              <p className="mt-4 text-sm text-slate-500 font-bold uppercase tracking-widest">Loading...</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-rose-50 border border-rose-100 p-6 text-center shadow-inner">
              <p className="text-sm text-rose-600 font-bold">{error}</p>
              <button 
                onClick={fetchPreferences}
                className="mt-4 rounded-xl bg-white px-6 py-2 text-xs font-black text-rose-600 shadow-sm border border-rose-100 hover:bg-rose-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Toggles */}
              <div className="space-y-5">
                <ToggleItem 
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Booking Notifications"
                  description="Updates about your facility bookings"
                  enabled={preferences.bookingEnabled}
                  onToggle={() => handleToggle('bookingEnabled')}
                  disabled={preferences.muteAll || saving}
                />
                <ToggleItem 
                  icon={<Ticket className="h-5 w-5" />}
                  label="Ticket Notifications"
                  description="Status updates on your support tickets"
                  enabled={preferences.ticketEnabled}
                  onToggle={() => handleToggle('ticketEnabled')}
                  disabled={preferences.muteAll || saving}
                />
                <ToggleItem 
                  icon={<Shield className="h-5 w-5" />}
                  label="System Notifications"
                  description="Important account and security alerts"
                  enabled={preferences.systemEnabled}
                  onToggle={() => handleToggle('systemEnabled')}
                  disabled={preferences.muteAll || saving}
                />
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Preferences</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Advanced Options */}
              <div className="space-y-5">
                <ToggleItem 
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Priority Only"
                  description="Only show HIGH priority notifications"
                  enabled={preferences.highPriorityOnly}
                  onToggle={() => handleToggle('highPriorityOnly')}
                  disabled={preferences.muteAll || saving}
                  colorClass="text-amber-500 bg-amber-50"
                />
                <ToggleItem 
                  icon={<VolumeX className="h-5 w-5" />}
                  label="Mute All"
                  description="Silence all incoming notifications"
                  enabled={preferences.muteAll}
                  onToggle={() => handleToggle('muteAll')}
                  disabled={saving}
                  colorClass="text-slate-500 bg-slate-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            {success ? (
              <div className="flex items-center gap-2 text-emerald-600 animate-in slide-in-from-left-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold">Settings saved!</span>
              </div>
            ) : (
              <div />
            )}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="rounded-2xl px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || saving}
                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-200 hover:bg-black hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all active:scale-95"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ToggleItem({ icon, label, description, enabled, onToggle, disabled, colorClass = "text-sky-600 bg-sky-50" }) {
  return (
    <div className={`flex items-center justify-between gap-4 transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="text-[11px] text-slate-500 truncate">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
          enabled ? 'bg-sky-500' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
