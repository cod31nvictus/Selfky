import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const AdminApplicationForm = () => {
  const { userId, courseType, applicationId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    courseType: courseType || '',
    fullName: '',
    fathersName: '',
    category: 'General',
    dateOfBirth: '',
    photo: null,
    signature: null
  });

  useEffect(() => {
    fetchUserAndApplication();
  }, [userId, applicationId]);

  const fetchUserAndApplication = async () => {
    try {
      setLoading(true);
      
      // Get user details
      const userResponse = await adminAPI.getApplicants();
      const userData = userResponse.find(u => u._id === userId);
      setUser(userData);

      // If editing existing application
      if (applicationId && applicationId !== courseType) {
        const applicationResponse = await adminAPI.getApplication(applicationId);
        setApplication(applicationResponse);
        
        // Pre-fill form with existing data
        setFormData({
          courseType: applicationResponse.courseType,
          fullName: applicationResponse.personalDetails?.fullName || '',
          fathersName: applicationResponse.personalDetails?.fathersName || '',
          category: applicationResponse.personalDetails?.category || 'General',
          dateOfBirth: applicationResponse.personalDetails?.dateOfBirth ? 
            new Date(applicationResponse.personalDetails.dateOfBirth).toISOString().split('T')[0] : '',
          photo: null,
          signature: null
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const submitData = new FormData();
      submitData.append('courseType', formData.courseType);
      submitData.append('fullName', formData.fullName);
      submitData.append('fathersName', formData.fathersName);
      submitData.append('category', formData.category);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      if (formData.photo) submitData.append('photo', formData.photo);
      if (formData.signature) submitData.append('signature', formData.signature);

      if (application) {
        // Update existing application
        await adminAPI.updateApplication(application._id, submitData);
      } else {
        // Create new application
        await adminAPI.createApplicationForUser(userId, submitData);
      }

      // Navigate to payment page
      navigate(`/admin/payment/${application?._id || 'new'}`);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = () => {
    const baseFee = formData.courseType === 'bpharm' ? 1000 : 1500;
    const categoryDiscount = {
      'General': 0,
      'OBC': 0.1,
      'SC': 0.2,
      'ST': 0.2,
      'PH': 0.25
    };
    const discount = categoryDiscount[formData.category] || 0;
    return Math.round(baseFee * (1 - discount));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
                Admin - Application Form
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Managing: {user?.email}
              </span>
              <button
                onClick={() => navigate(`/admin/applicant/${userId}`)}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Back to Applicant Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <span className="text-sm text-gray-600">
                Step {currentStep} of 3: {
                  currentStep === 1 ? 'Personal Details' :
                  currentStep === 2 ? 'Documents' : 'Review & Submit'
                }
              </span>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Type
                    </label>
                    <select
                      name="courseType"
                      value={formData.courseType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={!!application}
                    >
                      <option value="">Select Course</option>
                      <option value="bpharm">BPharm</option>
                      <option value="mpharm">MPharm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="PH">PH</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="fathersName"
                      value={formData.fathersName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter father's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={!formData.courseType || !formData.fullName || !formData.fathersName || !formData.dateOfBirth}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photo
                    </label>
                    <input
                      type="file"
                      name="photo"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload a recent passport size photo</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signature
                    </label>
                    <input
                      type="file"
                      name="signature"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload your signature</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Application Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Course Type</p>
                      <p className="text-sm font-medium text-gray-900">{formData.courseType === 'bpharm' ? 'BPharm' : 'MPharm'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-sm font-medium text-gray-900">{formData.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Father's Name</p>
                      <p className="text-sm font-medium text-gray-900">{formData.fathersName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{formData.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Application Fee</p>
                      <p className="text-sm font-medium text-gray-900">₹{calculateFee()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApplicationForm; 