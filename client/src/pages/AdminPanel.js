import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import ApplicantsSection from '../components/admin/ApplicantsSection';
import ApplicationsSection from '../components/admin/ApplicationsSection';
import TransactionsSection from '../components/admin/TransactionsSection';
import MonitoringDashboard from '../components/admin/MonitoringDashboard';
import SettingsSection from '../components/admin/SettingsSection';

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('applications');
  const { adminLogout, adminUser } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/cpanel/login');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'applicants':
        return <ApplicantsSection />;
      case 'applications':
        return <ApplicationsSection />;
      case 'transactions':
        return <TransactionsSection />;
      case 'monitoring':
        return <MonitoringDashboard />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <ApplicationsSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                className="h-8 w-auto mr-3"
                src="/selfky-logo.png"
                alt="Selfky Logo"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveSection('applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'applications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveSection('applicants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'applicants'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applicants
            </button>
            <button
              onClick={() => setActiveSection('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'transactions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveSection('monitoring')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'monitoring'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Monitoring
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel; 