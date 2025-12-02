'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Save, Check } from 'lucide-react';
import type { NotificationPreferences } from '@/types/dashboard';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/dashboard/api';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    email_reminders: true,
    reminder_time: '09:00:00',
    days_before_due: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const prefs = await getNotificationPreferences();
        if (prefs) {
          setPreferences(prefs);
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateNotificationPreferences(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your dashboard preferences</p>
      </div>

      {/* Notification Settings */}
      <div className="bg-space-800/60 border border-purple-500/20 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Configure how and when you receive task reminders
          </p>
        </div>

        <div className="p-4 space-y-6">
          {/* Email Reminders Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Email Reminders</p>
                <p className="text-sm text-gray-400">
                  Receive email notifications for upcoming deadlines
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setPreferences((prev) => ({
                  ...prev,
                  email_reminders: !prev.email_reminders,
                }))
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.email_reminders
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500'
                  : 'bg-space-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences.email_reminders ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Reminder Time */}
          <div className={preferences.email_reminders ? '' : 'opacity-50 pointer-events-none'}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-medium text-white">Reminder Time</p>
                <p className="text-sm text-gray-400">When to send daily reminders</p>
              </div>
            </div>
            <select
              value={preferences.reminder_time || '09:00:00'}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, reminder_time: e.target.value }))
              }
              className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="07:00:00">7:00 AM</option>
              <option value="08:00:00">8:00 AM</option>
              <option value="09:00:00">9:00 AM</option>
              <option value="10:00:00">10:00 AM</option>
              <option value="12:00:00">12:00 PM</option>
              <option value="18:00:00">6:00 PM</option>
            </select>
          </div>

          {/* Days Before Due */}
          <div className={preferences.email_reminders ? '' : 'opacity-50 pointer-events-none'}>
            <div className="mb-2">
              <p className="font-medium text-white">Advance Notice</p>
              <p className="text-sm text-gray-400">
                How many days before the deadline to send reminders
              </p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 7].map((days) => (
                <button
                  key={days}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, days_before_due: days }))
                  }
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    preferences.days_before_due === days
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                      : 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600'
                  }`}
                >
                  {days} {days === 1 ? 'day' : 'days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 border-t border-purple-500/20 bg-space-800/30">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
        <p className="text-sm text-cyan-300">
          <strong>Note:</strong> Email reminders are sent daily at the specified time.
          You'll receive notifications for tasks due on the reminder day and the following day.
        </p>
      </div>
    </div>
  );
}
