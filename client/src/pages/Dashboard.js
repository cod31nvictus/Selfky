import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admitCardReleased, setAdmitCardReleased] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    loadApplications();
    checkCancelledPayments();
    checkAdmitCardStatus();
  }, []);

  const checkCancelledPayments = async () => {
    try {
      const lastOrderId = localStorage.getItem('lastOrderId');
      const lastApplicationId = localStorage.getItem('lastApplicationId');
      
      if (lastOrderId && lastApplicationId) {
        console.log('Checking for cancelled payment:', { lastOrderId, lastApplicationId });
        
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/payment/check-cancelled-payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            orderId: lastOrderId,
            applicationId: lastApplicationId
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Payment status check result:', data);
          
          if (data.status === 'cancelled') {
            // Clear the stored order info
            localStorage.removeItem('lastOrderId');
            localStorage.removeItem('lastApplicationId');
            
            // Reload applications to show updated status
            loadApplications();
          }
        }
      }
    } catch (error) {
      console.error('Error checking cancelled payments:', error);
    }
  };

  const checkAdmitCardStatus = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/applications/admit-card-status`);
      if (response.ok) {
        const data = await response.json();
        setAdmitCardReleased(data.admitCardReleased);
        
        // Log additional info for debugging
        if (data.releaseDate && data.currentDate) {
          console.log('Admit card status:', {
            released: data.admitCardReleased,
            releaseDate: data.releaseDate,
            currentDate: data.currentDate,
            isAfterReleaseDate: data.isAfterReleaseDate
          });
        }
      }
    } catch (error) {
      console.error('Error checking admit card status:', error);
    }
  };

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
      console.log('API Response:', response); // Debug log
      
      // Handle different response structures
      let applicationsData = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          // Direct array response
          applicationsData = response;
        } else if (response.applications && Array.isArray(response.applications)) {
          // Object with applications array
          applicationsData = response.applications;
        } else {
          // Fallback to empty array
          applicationsData = [];
        }
      }
      
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatus = (courseType) => {
    if (!Array.isArray(applications) || applications.length === 0) return null;
    
    try {
      const application = applications.find(app => app && app.courseType === courseType);
      if (!application || !application.payment) return null;
      
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
    } catch (error) {
      console.error('Error getting application status:', error);
      return null;
    }
  };

  const getApplicationButton = (courseType) => {
    if (!Array.isArray(applications) || applications.length === 0) {
      return (
        <Link to={`/apply/${courseType}`}>
          <button className="w-full bg-[#101418] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors duration-200">
            Apply Now
          </button>
        </Link>
      );
    }
    
    try {
      const application = applications.find(app => app && app.courseType === courseType);
      const status = getApplicationStatus(courseType);

      if (!application) {
        return (
          <Link to={`/apply/${courseType}`}>
            <button className="w-full bg-[#101418] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors duration-200">
              Apply Now
            </button>
          </Link>
        );
      }

      if (status?.status === 'completed') {
        return (
          <div className="space-y-2">
            <div className="text-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                {status.text}
              </span>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => navigate(`/application/${application._id}`)}
                className="w-full bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                View Application
              </button>
              <button 
                onClick={() => navigate(`/admit-card/${application._id}`)}
                disabled={!admitCardReleased}
                className={`w-full py-2 px-6 rounded-lg font-medium transition-colors duration-200 text-sm ${
                  admitCardReleased 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {admitCardReleased ? 'View Admit Card' : 'Available from 22-08-2025'}
              </button>
            </div>
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
          <div className="space-y-2">
            <button 
              onClick={() => navigate(`/application/${application._id}`)}
              className="w-full bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              View Application
            </button>
            <button 
              onClick={() => navigate(`/payment/${application._id}`)}
              className="w-full bg-[#101418] text-white py-2 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors duration-200 text-sm"
            >
              Complete Payment
            </button>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error getting application button:', error);
      return (
        <Link to={`/apply/${courseType}`}>
          <button className="w-full bg-[#101418] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors duration-200">
            Apply Now
          </button>
        </Link>
      );
    }
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
          <span className="text-[#101418] text-sm font-medium">Welcome back!</span>
          <button 
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#eaedf1] text-[#101418] text-sm font-medium hover:bg-[#d4dbe2] transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#101418] mb-4">Available Courses</h1>
            <p className="text-lg text-[#5c728a] max-w-2xl mx-auto">
              Select a course below to begin your application process. Each course has specific requirements and deadlines.
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
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Open
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
                    <span>Last Date: 14-08-2025 (5pm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href="https://drive.google.com/file/d/1uiXdSR1VwWJ2_K48oCDW5swVHtZiO_xn/view?usp=drive_link" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Brochure</span>
                    </a>
                  </div>
                </div>

                {getApplicationButton('bpharm')}
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
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Open
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
                    <span>Last Date: 14-08-2025 (5pm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href="https://drive.google.com/file/d/1Pql8u6ID761sAx-lHmREw3AtVDruLlgJ/view?usp=drive_link" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Brochure</span>
                    </a>
                  </div>
                </div>

                {getApplicationButton('mpharm')}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-[#101418] mb-2">Application Process</h3>
              <p className="text-[#5c728a] text-sm">
                Click "Apply Now" on your preferred course to start the application process. 
                You'll need to fill out a detailed form and upload required documents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 