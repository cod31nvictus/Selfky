import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { applicationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isMasterAccess, setIsMasterAccess] = useState(false);
  const [masterUser, setMasterUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    loadApplications();
    
    // Check for redirect message
    if (location.state?.message) {
      setMessage(location.state.message);
      // Clear the message from location state
      navigate(location.pathname, { replace: true });
    }

    // Check if this is a master access session
    const accessType = localStorage.getItem('accessType');
    const masterUserData = localStorage.getItem('masterUser');
    
    if (accessType === 'master' && masterUserData) {
      setIsMasterAccess(true);
      setMasterUser(JSON.parse(masterUserData));
    }
  }, [location.state, navigate, location.pathname]);

  // Refresh applications when component comes into focus
  useEffect(() => {
    const handleFocus = () => {
      loadApplications();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadApplications = async () => {
    try {
      const response = await applicationAPI.getMyApplications();
      setApplications(response);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatus = (courseType) => {
    const application = applications.find(app => app.courseType === courseType);
    if (!application) return null;
    
    switch (application.payment.status) {
      case 'pending':
        return { status: 'pending', text: 'Payment Pending', color: 'yellow' };
      case 'completed':
        return { status: 'completed', text: 'Payment Completed', color: 'green' };
      case 'failed':
        return { status: 'failed', text: 'Payment Failed', color: 'red' };
      case 'cancelled':
        return { status: 'cancelled', text: 'Payment Cancelled', color: 'gray' };
      default:
        return { status: 'pending', text: 'Payment Pending', color: 'yellow' };
    }
  };

  const getAdmitCardButton = (courseType) => {
    const application = applications.find(app => app.courseType === courseType);
    const status = getApplicationStatus(courseType);

    if (!application) {
      return (
        <button 
          disabled
          className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed"
        >
          No Application Found
        </button>
      );
    }

    if (status?.status === 'completed') {
      return (
        <div className="space-y-2">
          <div className="text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {status.text}
            </span>
          </div>
          <button 
            onClick={() => navigate(`/admit-card/${application._id}`)}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
          >
            Download Admit Card
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
            {status.text}
          </span>
        </div>
        <button 
          disabled
          className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed"
        >
          Download Admit Card
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#101418] mx-auto"></div>
          <p className="mt-4 text-[#5c728a]">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{fontFamily: '"Public Sans", "Noto Sans", sans-serif'}}>
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#eaedf1] px-4 py-0 bg-white">
        <div className="flex items-center gap-4 text-[#101418]">
          <div className="size-20">
            <img src="/selfky-logo.png" alt="Selfky Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isMasterAccess && masterUser && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-800 text-sm font-medium">🔐 Master Access</span>
                <span className="text-yellow-600 text-xs">Viewing as: {masterUser.email}</span>
              </div>
            </div>
          )}
          <span className="text-[#101418] text-sm font-medium">
            {isMasterAccess && masterUser 
              ? `Welcome, ${masterUser.name || masterUser.email} (Master Access)`
              : 'Welcome back!'
            }
          </span>
          <button 
            onClick={() => {
              // Clear master access data if it exists
              if (isMasterAccess) {
                localStorage.removeItem('masterToken');
                localStorage.removeItem('masterUser');
                localStorage.removeItem('accessType');
                localStorage.removeItem('token');
                setIsMasterAccess(false);
                setMasterUser(null);
                navigate('/cpanel');
                return;
              }
              logout();
              navigate('/');
            }}
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#eaedf1] text-[#101418] text-sm font-medium hover:bg-[#d4dbe2] transition-colors"
          >
            {isMasterAccess ? 'Exit Master Access' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Message Display */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4 mt-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-800 text-sm">{message}</p>
            <button 
              onClick={() => setMessage('')}
              className="ml-auto text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#101418] mb-4">Admit Card Download</h1>
            <p className="text-lg text-[#5c728a] max-w-2xl mx-auto">
              Applications are now closed. Download your admit card if your payment is completed.
            </p>
          </div>

          {/* Course Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* BPharm Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#dce7f3] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#101418]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#101418]">BPharm (Ay.)</h3>
                      <p className="text-sm text-[#5c728a]">Bachelor of Pharmacy</p>
                    </div>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Closed
                  </span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[#5c728a]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Session: 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5c728a]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Duration: 4 Years</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5c728a]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Seats: 60</span>
                  </div>
                </div>

                {getAdmitCardButton('bpharm')}
              </div>
            </div>

            {/* MPharm Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#dce7f3] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#101418]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#101418]">MPharm (Ay.)</h3>
                      <p className="text-sm text-[#5c728a]">Master of Pharmacy</p>
                    </div>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Closed
                  </span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[#5c728a]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Session: 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5c728a]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Duration: 2 Years</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5c728a]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Seats: 30</span>
                  </div>
                </div>

                {getAdmitCardButton('mpharm')}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-[#101418] mb-2">Admit Card Information</h3>
              <p className="text-[#5c728a] text-sm">
                Applications are now closed for the 2025 session. You can only download your admit card if your payment has been completed. 
                For any issues, please contact the administration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 