import React, { useState, useEffect } from 'react';

const SettingsSection = () => {
  const [settings, setSettings] = useState({
    admitCardReleased: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'x-admin-token': localStorage.getItem('adminToken')
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'x-admin-token': localStorage.getItem('adminToken')
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        alert('Settings updated successfully!');
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAdmitCardToggle = () => {
    const newSettings = {
      ...settings,
      admitCardReleased: !settings.admitCardReleased
    };
    updateSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Application Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage global application settings and configurations.
        </p>
      </div>
      
      <div className="px-6 py-4 space-y-6">
        {/* Admit Card Release Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Admit Card Release</h4>
            <p className="text-sm text-gray-500">
              When enabled, users can view and download their admit cards. When disabled, the "View Admit Card" button will be disabled for all users.
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleAdmitCardToggle}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                settings.admitCardReleased ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.admitCardReleased ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-3 text-sm font-medium text-gray-900">
              {settings.admitCardReleased ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-gray-500 w-32">Admit Cards:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                settings.admitCardReleased 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {settings.admitCardReleased ? 'Released' : 'Not Released'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 w-32">Release Date:</span>
              <span className="text-gray-900">22-08-2025</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enable the toggle to allow users to view and download admit cards</li>
            <li>• Disable the toggle to prevent users from accessing admit cards</li>
            <li>• Changes take effect immediately for all users</li>
            <li>• The admit card release date (22-08-2025) is displayed on all admit cards</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection; 