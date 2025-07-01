import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const AdminApplicantDashboard = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndApplications();
  }, [userId]);

  const fetchUserAndApplications = async () => {
    try {
      setLoading(true);
      // Get user details
      const userResponse = await adminAPI.getApplicants();
      const userData = userResponse.find(u => u._id === userId);
      setUser(userData);

      // Get user's applications
      const applicationsResponse = await adminAPI.getApplications();
      const userApplications = applicationsResponse.filter(app => app.userId._id === userId);
      setApplications(userApplications);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'payment_pending':
        return 'bg-orange-100 text-orange-800';
      case 'payment_completed':
        return 'bg-green-100 text-green-800';
      case 'admit_card_generated':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'payment_pending':
        return 'Payment Pending';
      case 'payment_completed':
        return 'Payment Completed';
      case 'admit_card_generated':
        return 'Admit Card Generated';
      default:
        return status;
    }
  };

  const handleStartApplication = (courseType) => {
    // Navigate to application form with user context
    navigate(`/admin/application-form/${userId}/${courseType}`);
  };

  const handleContinueApplication = (applicationId) => {
    // Navigate to continue the application
    navigate(`/admin/application-form/${userId}/${applicationId}`);
  };

  const handleViewAdmitCard = (applicationId) => {
    navigate(`/admin/admit-card/${applicationId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">User not found</h2>
          <p className="text-gray-600 mt-2">The requested user could not be found.</p>
        </div>
      </div>
    );
  }

  const bpharmApplication = applications.find(app => app.courseType === 'bpharm');
  const mpharmApplication = applications.find(app => app.courseType === 'mpharm');

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
                Admin - Applicant Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Managing: {user.email}
              </span>
              <button
                onClick={() => navigate('/cpanel')}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Back to Admin Panel
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Info */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Joined</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-sm font-medium text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>

          {/* Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BPharm Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">BPharm Application</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bpharmApplication?.status || 'draft')}`}>
                  {getStatusLabel(bpharmApplication?.status || 'draft')}
                </span>
              </div>
              
              {bpharmApplication ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Application Number</p>
                    <p className="text-sm font-medium text-gray-900">{bpharmApplication.applicationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applicant Name</p>
                    <p className="text-sm font-medium text-gray-900">{bpharmApplication.personalDetails?.fullName || 'N/A'}</p>
                  </div>
                  <div className="flex space-x-3 pt-3">
                    {bpharmApplication.status === 'admit_card_generated' ? (
                      <button
                        onClick={() => handleViewAdmitCard(bpharmApplication._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        View Admit Card
                      </button>
                    ) : (
                      <button
                        onClick={() => handleContinueApplication(bpharmApplication._id)}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                      >
                        Continue Application
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No BPharm application yet</p>
                  <button
                    onClick={() => handleStartApplication('bpharm')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Start BPharm Application
                  </button>
                </div>
              )}
            </div>

            {/* MPharm Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">MPharm Application</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(mpharmApplication?.status || 'draft')}`}>
                  {getStatusLabel(mpharmApplication?.status || 'draft')}
                </span>
              </div>
              
              {mpharmApplication ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Application Number</p>
                    <p className="text-sm font-medium text-gray-900">{mpharmApplication.applicationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applicant Name</p>
                    <p className="text-sm font-medium text-gray-900">{mpharmApplication.personalDetails?.fullName || 'N/A'}</p>
                  </div>
                  <div className="flex space-x-3 pt-3">
                    {mpharmApplication.status === 'admit_card_generated' ? (
                      <button
                        onClick={() => handleViewAdmitCard(mpharmApplication._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        View Admit Card
                      </button>
                    ) : (
                      <button
                        onClick={() => handleContinueApplication(mpharmApplication._id)}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                      >
                        Continue Application
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No MPharm application yet</p>
                  <button
                    onClick={() => handleStartApplication('mpharm')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Start MPharm Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApplicantDashboard; 