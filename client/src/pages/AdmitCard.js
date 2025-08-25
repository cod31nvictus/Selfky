import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { applicationAPI, adminAPI } from '../services/api';

const AdmitCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { applicationId } = useParams();
  const [applicationData, setApplicationData] = useState(null);
  const [admitCardData, setAdmitCardData] = useState(null);
  const [currentStep, setCurrentStep] = useState(3);
  const [completedSteps, setCompletedSteps] = useState([1, 2]);
  const [loading, setLoading] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading application data for ID:', applicationId);
      
      // Check admin view directly here instead of relying on state
      const adminToken = localStorage.getItem('adminToken');
      const isAdmin = location.pathname.startsWith('/admin/') && adminToken;
      console.log('Admin view detection in loadApplicationData:', {
        pathname: location.pathname,
        adminToken: adminToken ? 'Present' : 'Missing',
        isAdmin: isAdmin
      });
      
      let application;
      let admitCardData;
      
      if (isAdmin) {
        // For admin view, use admin admit card API endpoint
        console.log('Using admin API to fetch admit card data');
        try {
          admitCardData = await adminAPI.getAdmitCard(applicationId);
          console.log('Admin admit card data received:', admitCardData);
          
          // Convert to application data format
          application = {
            _id: applicationId,
            applicationNumber: admitCardData.applicationNumber,
            courseType: admitCardData.courseType === 'B.Pharm' ? 'bpharm' : 'mpharm',
            personalDetails: {
              fullName: admitCardData.fullName,
              category: admitCardData.category
            }
          };
        } catch (adminError) {
          console.error('Admin admit card API failed, trying regular admin API:', adminError);
          // Fallback to regular admin API
          application = await adminAPI.getApplication(applicationId);
        }
      } else {
        // For user view, use regular API endpoint
        console.log('Using user API to fetch application');
        application = await applicationAPI.getApplication(applicationId);
      }
      
      console.log('Application data received:', application);
      
      // Convert application data to the format expected by generateAdmitCard
      const applicationDataFromAPI = {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        courseType: application.courseType,
        formData: {
          fullName: application.personalDetails?.fullName || 'N/A',
          fathersName: application.personalDetails?.fathersName || 'N/A',
          category: application.personalDetails?.category || 'N/A',
          dateOfBirth: application.personalDetails?.dateOfBirth || 'N/A'
        },
        documents: {
          photo: application.documents?.photo || null,
          signature: application.documents?.signature || null
        },
        courseInfo: {
          name: application.courseType === 'bpharm' ? 'BPharm (Ay.) 2025' : 'MPharm (Ay.) 2025',
          fullName: application.courseType === 'bpharm' ? 'Bachelor of Pharmacy (Ayurveda) 2025' : 'Master of Pharmacy (Ayurveda) 2025'
        }
      };
      
      setApplicationData(applicationDataFromAPI);
      setCompletedSteps([1, 2, 3]);
      
      // If we have admit card data from admin API, use it directly
      if (admitCardData) {
        setAdmitCardData({
          applicationNumber: admitCardData.applicationNumber,
          examDate: admitCardData.examDate,
          examCenter: admitCardData.examCenter,
          examCenterAddress: 'BHU, Varanasi, Uttar Pradesh - 221005',
          instructions: [
            'Please arrive at the exam center 1 hour before the exam time',
            'Carry this admit card and a valid photo ID proof',
            'No electronic devices are allowed in the examination hall',
            'Follow all COVID-19 safety protocols as per institute guidelines',
            'Report to the examination hall 30 minutes before the exam starts'
          ]
        });
      } else {
        // Set default admit card data
        setAdmitCardData({
          applicationNumber: application.applicationNumber,
          examDate: '31-08-2025',
          examTime: '11:00 am to 1:00 pm',
          examCenter: 'NLT Institute of Medical Sciences BHU',
          examCenterAddress: 'BHU, Varanasi, Uttar Pradesh - 221005',
          instructions: [
            'Please arrive at the exam center 1 hour before the exam time',
            'Carry this admit card and a valid photo ID proof',
            'No electronic devices are allowed in the examination hall',
            'Follow all COVID-19 safety protocols as per institute guidelines',
            'Report to the examination hall 30 minutes before the exam starts'
          ]
        });
      }
    } catch (error) {
      console.error('Error loading application data:', error);
      // Don't show alert, just set loading to false
      setLoading(false);
    }
  };

  const generateAdmitCard = async (data) => {
    console.log('🔍 Starting generateAdmitCard with data:', data);
    setLoading(true);
    
    // Safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout
    
    try {
      console.log('🔄 Setting admit card data from application data');
      
      // Use the application data directly to set admit card data
      const admitCard = {
        applicationNumber: data.applicationNumber || 'APP' + Date.now(),
        examDate: '31-08-2025',
        examTime: '11:00 am to 1:00 pm',
        examCenter: 'NLT Institute of Medical Sciences BHU',
        examCenterAddress: 'BHU, Varanasi, Uttar Pradesh - 221005',
        instructions: [
          'Please arrive at the exam center 1 hour before the exam time',
          'Carry this admit card and a valid photo ID proof',
          'No electronic devices are allowed in the examination hall',
          'Follow all COVID-19 safety protocols as per institute guidelines',
          'Report to the examination hall 30 minutes before the exam starts'
        ]
      };
      
      setAdmitCardData(admitCard);
      console.log('✅ Admit card data set successfully:', admitCard);
      
    } catch (error) {
      console.error('❌ Error in generateAdmitCard:', error);
      
      // Generate fallback admit card data even on error
      const fallbackAdmitCard = {
        applicationNumber: data.applicationNumber || 'APP' + Date.now(),
        examDate: '31-08-2025',
        examTime: '11:00 am to 1:00 pm',
        examCenter: 'NLT Institute of Medical Sciences BHU',
        examCenterAddress: 'BHU, Varanasi, Uttar Pradesh - 221005',
        instructions: [
          'Please arrive at the exam center 1 hour before the exam time',
          'Carry this admit card and a valid photo ID proof',
          'No electronic devices are allowed in the examination hall',
          'Follow all COVID-19 safety protocols as per institute guidelines',
          'Report to the examination hall 30 minutes before the exam starts'
        ]
      };
      
      setAdmitCardData(fallbackAdmitCard);
      console.log('✅ Fallback admit card data set');
    } finally {
      clearTimeout(loadingTimeout); // Clear the timeout
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered with:', { location, applicationId, navigate });
    
    // Check if this is an admin view (path starts with /admin/ and has admin token)
    const adminToken = localStorage.getItem('adminToken');
    const isAdmin = location.pathname.startsWith('/admin/') && adminToken;
    console.log('Admin view detection:', {
      pathname: location.pathname,
      adminToken: adminToken ? 'Present' : 'Missing',
      isAdmin: isAdmin
    });
    setIsAdminView(isAdmin);

    // If trying to access admin route without admin token, redirect to admin login
    if (location.pathname.startsWith('/admin/') && !adminToken) {
      console.log('Redirecting to admin login - no admin token');
      navigate('/admin/login');
      return;
    }

    if (location.state) {
      console.log('📍 Location state found:', location.state);
      setApplicationData(location.state);
      if (location.state.completedSteps) {
        setCompletedSteps(location.state.completedSteps);
      }
      // Generate admit card data
      console.log('🚀 Calling generateAdmitCard with location.state');
      generateAdmitCard(location.state);
    } else if (applicationId) {
      console.log('🆔 Application ID found, calling loadApplicationData');
      // Load application data from API if applicationId is provided
      loadApplicationData();
    } else {
      console.log('⚠️ No location.state and no applicationId - this might be the issue');
      // Force loading to false if no data
      setLoading(false);
    }
  }, [location, applicationId, navigate]);

  // Add a simple fallback mechanism
  useEffect(() => {
    // If we've been loading for more than 5 seconds, force stop
    if (loading) {
      const timer = setTimeout(() => {
        console.log('⏰ Loading timeout - forcing loading to false');
        setLoading(false);
        
        // Set some basic data to prevent the "no data" screen
        if (!admitCardData) {
          setAdmitCardData({
            applicationNumber: 'N/A',
            examDate: '31-08-2025',
            examTime: '11:00 am to 1:00 pm',
            examCenter: 'NLT Institute of Medical Sciences BHU',
            examCenterAddress: 'BHU, Varanasi, Uttar Pradesh - 221005',
            instructions: [
              'Please arrive at the exam center 1 hour before the exam time',
              'Carry this admit card and a valid photo ID proof',
              'No electronic devices are allowed in the examination hall',
              'Follow all COVID-19 safety protocols as per institute guidelines',
              'Report to the examination hall 30 minutes before the exam starts'
            ]
          });
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, admitCardData]);


  const handlePrint = () => {
    window.print();
  };

  const handleStepClick = (step) => {
    // Only allow navigation to current step or next step
    // Don't allow going back to completed steps for editing
    if (step === currentStep || step === currentStep + 1) {
      if (step === 1) {
        // Navigate back to application form (only if current step is 1)
        navigate('/apply/' + applicationData?.courseType, {
          state: { 
            formData: applicationData?.formData,
            completedSteps: completedSteps,
            applicationId: applicationData?.applicationId
          }
        });
      } else if (step === 2) {
        // Navigate back to payment page (only if current step is 2)
        navigate('/payment', {
          state: applicationData
        });
      } else {
        setCurrentStep(step);
      }
    }
  };

  const isStepCompleted = (step) => {
    return completedSteps.includes(step);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#101418] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#101418] mb-2">Generating Admit Card...</h2>
          <p className="text-[#5c728a] mb-4">Please wait while we generate your admit card.</p>
          
          {/* Debug Information */}
          <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Loading: {loading.toString()}</p>
            <p>Application Data: {applicationData ? 'Present' : 'Missing'}</p>
            <p>Admit Card Data: {admitCardData ? 'Present' : 'Missing'}</p>
            <p>Location State: {location.state ? 'Present' : 'Missing'}</p>
            <p>Application ID: {applicationId || 'None'}</p>
            <p>Time: {new Date().toLocaleTimeString()}</p>
          </div>
          
          {/* Force Stop Button */}
          <button 
            onClick={() => {
              console.log('🛑 Force stop loading clicked');
              setLoading(false);
            }}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Force Stop Loading
          </button>
        </div>
      </div>
    );
  }

  if (!applicationData || !admitCardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#101418] mb-4">
            {isAdminView ? 'Application Not Found' : 'No Application Data Found'}
          </h2>
          <p className="text-[#5c728a] mb-4">
            {isAdminView 
              ? 'The application you are looking for could not be found.' 
              : 'Please complete the application process first.'
            }
          </p>
          <button 
            onClick={() => isAdminView ? window.close() : navigate('/dashboard')}
            className="bg-[#101418] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors"
          >
            {isAdminView ? 'Close Window' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const getImageUrl = (path) => {
    if (!path) return '';
    
    // If it's already a full URL (S3 or other), return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's an S3 path like 'photos/1755180769534-g0onb.jpg' or 'signatures/1755180769603-qc7dob.jpg'
    if (path.includes('/') && (path.startsWith('photos/') || path.startsWith('signatures/') || path.startsWith('certificates/'))) {
      return `https://selfky-applications-2025.s3.eu-north-1.amazonaws.com/${path}`;
    }
    
    // If it's just a filename, construct S3 URL (fallback)
    if (!path.includes('/')) {
      return `https://selfky-applications-2025.s3.eu-north-1.amazonaws.com/${path}`;
    }
    
    // If it's a local path, extract filename and construct S3 URL (fallback)
    const filename = path.split('/').pop();
    return `https://selfky-applications-2025.s3.eu-north-1.amazonaws.com/${filename}`;
  };

  return (
    <div className="bg-gray-50" style={{fontFamily: '"Public Sans", "Noto Sans", sans-serif'}}>
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#eaedf1] px-4 py-0 bg-white print:hidden sticky top-0 z-10">
        <div className="flex items-center gap-4 text-[#101418]">
                    <div className="size-20">
            <img src="/selfky-logo.png" alt="Selfky Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#101418] text-sm font-medium">
            {isAdminView ? 'Admin View - Admit Card' : 'Admit Card Generated'}
          </span>
        </div>
      </header>

      {/* Progress Bar - Only show for user view */}
      {!isAdminView && (
        <div className="bg-white border-b border-gray-200 print:hidden sticky top-20 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div 
                className={`flex items-center ${isStepCompleted(1) ? 'text-green-600' : 'text-gray-400'}`}
                onClick={() => isStepCompleted(1) ? null : handleStepClick(1)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isStepCompleted(1) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  {isStepCompleted(1) ? '✓' : '1'}
                </div>
                <span className="ml-2 font-medium">Personal Details</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-full transition-all duration-300 ${isStepCompleted(1) ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'}`}></div>
              </div>
              <div 
                className={`flex items-center ${isStepCompleted(2) ? 'text-green-600' : 'text-gray-400'}`}
                onClick={() => isStepCompleted(2) ? null : handleStepClick(2)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isStepCompleted(2) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  {isStepCompleted(2) ? '✓' : '2'}
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-full transition-all duration-300 ${isStepCompleted(2) ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'}`}></div>
              </div>
              <div 
                className={`flex items-center cursor-pointer transition-colors ${currentStep === 3 ? 'text-[#101418]' : 'text-gray-400'}`}
                onClick={() => handleStepClick(3)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 3 ? 'bg-[#101418] text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">Admit Card</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16 pb-20 print:px-0 print:py-0 print:pb-0">
        <div className="max-w-4xl mx-auto print:max-w-none">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 print:hidden">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Application Submitted Successfully!</h3>
                <p className="text-green-700">Your admit card has been generated. Please review and download it.</p>
              </div>
            </div>
          </div>

          {/* Admit Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 print:p-4 print:shadow-none print:border print:rounded-none print:bg-white print:min-h-0">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-300 pb-4 mb-4 print:pb-2 print:mb-2">
              <div className="flex items-center justify-center mb-2 print:mb-1">
                <img src="/bhu-logo.png" alt="IMS BHU Logo" className="h-12 w-auto print:h-10" />
              </div>
              <h1 className="text-2xl font-bold text-[#101418] mb-1 print:text-xl print:mb-0">ADMIT CARD</h1>
              <p className="text-base text-[#5c728a] print:text-sm">{applicationData.courseInfo?.fullName}</p>
            </div>

            {/* Applicant Details and Examination Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-6 print:gap-4 print:mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#101418] mb-3 print:text-sm print:mb-2">Applicant Details</h3>
                <div className="space-y-2 print:space-y-1">
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Application Number:</span>
                    <span className="font-semibold text-[#101418]">{admitCardData.applicationNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Full Name:</span>
                    <span className="font-semibold text-[#101418]">{applicationData.formData?.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Father's Name:</span>
                    <span className="font-semibold text-[#101418]">{applicationData.formData?.fathersName}</span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Category:</span>
                    <span className="font-semibold text-[#101418]">{applicationData.formData?.category}</span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Date of Birth:</span>
                    <span className="font-semibold text-[#101418]">
                      {applicationData.formData?.dateOfBirth ? 
                        new Date(applicationData.formData.dateOfBirth).toLocaleDateString('en-GB') : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#101418] mb-3 print:text-sm print:mb-2">Examination Details</h3>
                <div className="space-y-2 print:space-y-1">
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Exam Date:</span>
                    <span className="font-semibold text-[#101418]">{admitCardData.examDate}</span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Exam Time:</span>
                    <span className="font-semibold text-[#101418]">{admitCardData.examTime}</span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Exam Center:</span>
                    <span className="font-semibold text-[#101418]">{admitCardData.examCenter}</span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="font-medium text-[#5c728a]">Center Address:</span>
                    <span className="font-semibold text-[#101418]">{admitCardData.examCenterAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo and Signature Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-6 print:gap-4 print:mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#101418] mb-2 print:text-sm print:mb-1">Applicant Photo</h3>
                {/* Photo Display */}
                {applicationData.documents?.photo ? (
                  <div className="mb-2 print:mb-1">
                    <div className="w-24 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 print:w-20 print:h-28">
                      <img
                        src={getImageUrl(applicationData.documents.photo)}
                        alt="Applicant Photo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-gray-500 text-xs">
                        Photo not available
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-32 border-2 border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center print:w-20 print:h-28">
                    <span className="text-gray-500 text-xs">No Photo</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#101418] mb-2 print:text-sm print:mb-1">Applicant Signature</h3>
                {/* Signature Display */}
                {applicationData.documents?.signature ? (
                  <div className="mb-2 print:mb-1">
                    <div className="w-24 h-16 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 print:w-20 print:h-14">
                      <img
                        src={getImageUrl(applicationData.documents.signature)}
                        alt="Applicant Signature"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-gray-500 text-xs">
                        Signature not available
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-16 border-2 border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center print:w-20 print:h-14">
                    <span className="text-gray-500 text-xs">No Signature</span>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Center */}
            <div className="mb-6 print:mb-4">
              <h3 className="text-base font-semibold text-[#101418] mb-2 print:text-sm print:mb-1">Examination Center</h3>
              <div className="bg-gray-50 rounded-lg p-3 print:p-2">
                <p className="font-semibold text-[#101418] mb-1 print:text-sm print:mb-0">{admitCardData.examCenter}</p>
                <p className="text-[#5c728a] text-sm print:text-xs">{admitCardData.examCenterAddress}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 print:mb-4">
              <h3 className="text-base font-semibold text-[#101418] mb-2 print:text-sm print:mb-1">Important Instructions</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 print:p-2">
                <ul className="space-y-1 text-xs print:text-xs">
                  {admitCardData.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-600 mr-2 flex-shrink-0">•</span>
                      <span className="text-[#5c728a]">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Signature Section */}
            <div className="flex justify-between items-end border-t-2 border-gray-300 pt-4 print:pt-2">
              <div className="text-center">
                <div className="w-24 h-12 border-b-2 border-gray-400 mb-1 print:w-20 print:h-10"></div>
                <p className="text-xs text-[#5c728a] print:text-xs">Applicant's Signature</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-12 border-b-2 border-gray-400 mb-1 print:w-20 print:h-10"></div>
                <p className="text-xs text-[#5c728a] print:text-xs">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4 print:hidden">
            <button
              onClick={handlePrint}
              className="bg-[#101418] text-white py-3 px-8 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors"
            >
              Print Admit Card
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-300 text-[#101418] py-3 px-8 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Floating Action Button for Mobile */}
          <div className="fixed bottom-6 right-6 print:hidden md:hidden">
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePrint}
                className="bg-[#101418] text-white p-4 rounded-full shadow-lg hover:bg-[#2a2f36] transition-colors"
                title="Print Admit Card"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmitCard; 