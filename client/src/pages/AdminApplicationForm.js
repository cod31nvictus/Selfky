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
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [formData, setFormData] = useState({
    courseType: courseType || '',
    fullName: '',
    fathersName: '',
    category: 'General',
    dateOfBirth: '',
    aadharNumber: '',
    sex: '',
    nationality: '',
    correspondenceAddress: '',
    permanentAddress: '',
    correspondencePhone: '',
    highSchoolRollNo: '',
    highSchoolBoard: '',
    highSchoolYear: '',
    highSchoolSubjects: '',
    highSchoolMarksObtained: '',
    highSchoolMaxMarks: '',
    highSchoolPercentage: '',
    qualifyingExamRollNo: '',
    qualifyingExamStatus: '',
    qualifyingBoard: '',
    qualifyingYear: '',
    qualifyingSubjects: '',
    qualifyingMarksObtained: '',
    qualifyingMaxMarks: '',
    qualifyingPercentage: '',
    // BPharm Year fields for MPharm
    bpharmYear1MarksObtained: '',
    bpharmYear1MaxMarks: '',
    bpharmYear1Percentage: '',
    bpharmYear2MarksObtained: '',
    bpharmYear2MaxMarks: '',
    bpharmYear2Percentage: '',
    bpharmYear3MarksObtained: '',
    bpharmYear3MaxMarks: '',
    bpharmYear3Percentage: '',
    bpharmYear4MarksObtained: '',
    bpharmYear4MaxMarks: '',
    bpharmYear4Percentage: '',
    placeOfApplication: '',
    photo: null,
    signature: null,
    categoryCertificate: null,
    highSchoolCertificate: null,
    intermediateCertificate: null,
    // BPharm marksheets for MPharm
    bpharmYear1Marksheet: null,
    bpharmYear2Marksheet: null,
    bpharmYear3Marksheet: null,
    bpharmYear4Marksheet: null,
    bpharmDegree: null
  });

  useEffect(() => {
    fetchUserAndApplication();
  }, [userId, applicationId]);

  const fetchUserAndApplication = async () => {
    try {
      setLoading(true);
      
      // Get user details
      const userResponse = await adminAPI.getApplicants();
      const userData = (userResponse.applicants || userResponse).find(u => u._id === userId);
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
    const file = files[0];
    
    if (file) {
      // Define allowed file types based on field name
      let allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      let errorMessage = 'Invalid file type! Please use JPG or PNG format. Images will be automatically optimized for size.';
      
      // For document fields, also allow PDF files
      if (name === 'categoryCertificate' || name === 'highSchoolCertificate' || name === 'intermediateCertificate' || 
          name === 'bpharmYear1Marksheet' || name === 'bpharmYear2Marksheet' || name === 'bpharmYear3Marksheet' || 
          name === 'bpharmYear4Marksheet' || name === 'bpharmDegree') {
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        errorMessage = 'Invalid file type! Please use JPG, PNG, or PDF format.';
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(errorMessage);
        e.target.value = ''; // Clear the input
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    }
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
    // Validate disclaimer
    if (!disclaimerAccepted) {
      alert('Please accept the declaration to proceed with the application.');
      return;
    }

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
      if (formData.categoryCertificate) submitData.append('categoryCertificate', formData.categoryCertificate);
      if (formData.highSchoolCertificate) submitData.append('highSchoolCertificate', formData.highSchoolCertificate);
      if (formData.intermediateCertificate) submitData.append('intermediateCertificate', formData.intermediateCertificate);

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
    // New fee structure based on category and course type
    if (formData.courseType === 'bpharm') {
      // BPharm fees
      if (['General', 'OBC', 'EWS'].includes(formData.category)) {
        return 1200;
      } else if (['SC', 'ST', 'PWD'].includes(formData.category)) {
        return 900;
      }
    } else if (formData.courseType === 'mpharm') {
      // MPharm fees
      if (['General', 'OBC', 'EWS'].includes(formData.category)) {
        return 1500;
      } else if (['SC', 'ST', 'PWD'].includes(formData.category)) {
        return 1000;
      }
    }
    // Default fallback
    return formData.courseType === 'bpharm' ? 1200 : 1500;
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
                      <option value="EWS">EWS</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="PWD">PWD</option>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Aadhar number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sex
                    </label>
                    <select
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter nationality"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correspondence Address
                    </label>
                    <textarea
                      name="correspondenceAddress"
                      value={formData.correspondenceAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter correspondence address"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permanent Address
                    </label>
                    <textarea
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter permanent address"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="correspondencePhone"
                      value={formData.correspondencePhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High School Roll No
                    </label>
                    <input
                      type="text"
                      name="highSchoolRollNo"
                      value={formData.highSchoolRollNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter high school roll number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High School Board
                    </label>
                    <input
                      type="text"
                      name="highSchoolBoard"
                      value={formData.highSchoolBoard}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter board name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High School Year
                    </label>
                    <input
                      type="text"
                      name="highSchoolYear"
                      value={formData.highSchoolYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter year of passing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High School Subjects
                    </label>
                    <input
                      type="text"
                      name="highSchoolSubjects"
                      value={formData.highSchoolSubjects}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter subjects"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High School Marks Obtained
                    </label>
                    <input
                      type="text"
                      name="highSchoolMarksObtained"
                      value={formData.highSchoolMarksObtained}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter marks obtained"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High School Max Marks
                    </label>
                    <input
                      type="text"
                      name="highSchoolMaxMarks"
                      value={formData.highSchoolMaxMarks}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter maximum marks"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High School Percentage
                    </label>
                    <input
                      type="text"
                      name="highSchoolPercentage"
                      value={formData.highSchoolPercentage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter percentage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Exam Roll No
                    </label>
                    <input
                      type="text"
                      name="qualifyingExamRollNo"
                      value={formData.qualifyingExamRollNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter qualifying exam roll number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Exam Status
                    </label>
                    <select
                      name="qualifyingExamStatus"
                      value={formData.qualifyingExamStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Status</option>
                      <option value="appearing">Appearing</option>
                      <option value="passed">Passed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Board
                    </label>
                    <input
                      type="text"
                      name="qualifyingBoard"
                      value={formData.qualifyingBoard}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter board name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Year
                    </label>
                    <input
                      type="text"
                      name="qualifyingYear"
                      value={formData.qualifyingYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter year of passing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Subjects
                    </label>
                    <input
                      type="text"
                      name="qualifyingSubjects"
                      value={formData.qualifyingSubjects}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter subjects"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Marks Obtained
                    </label>
                    <input
                      type="text"
                      name="qualifyingMarksObtained"
                      value={formData.qualifyingMarksObtained}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter marks obtained"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Max Marks
                    </label>
                    <input
                      type="text"
                      name="qualifyingMaxMarks"
                      value={formData.qualifyingMaxMarks}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter maximum marks"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifying Percentage
                    </label>
                    <input
                      type="text"
                      name="qualifyingPercentage"
                      value={formData.qualifyingPercentage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter percentage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Place of Application
                    </label>
                    <input
                      type="text"
                      name="placeOfApplication"
                      value={formData.placeOfApplication}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter place of application"
                    />
                  </div>
                </div>

                {/* Conditional BPharm Year Details for MPharm */}
                {formData.courseType === 'mpharm' && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">BPharm Year Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* BPharm Year 1 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">BPharm Year 1</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
                            <input
                              type="text"
                              name="bpharmYear1MarksObtained"
                              value={formData.bpharmYear1MarksObtained}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter marks obtained"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                            <input
                              type="text"
                              name="bpharmYear1MaxMarks"
                              value={formData.bpharmYear1MaxMarks}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter total marks"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                            <input
                              type="text"
                              name="bpharmYear1Percentage"
                              value={formData.bpharmYear1Percentage}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter percentage"
                            />
                          </div>
                        </div>
                      </div>

                      {/* BPharm Year 2 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">BPharm Year 2</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
                            <input
                              type="text"
                              name="bpharmYear2MarksObtained"
                              value={formData.bpharmYear2MarksObtained}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter marks obtained"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                            <input
                              type="text"
                              name="bpharmYear2MaxMarks"
                              value={formData.bpharmYear2MaxMarks}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter total marks"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                            <input
                              type="text"
                              name="bpharmYear2Percentage"
                              value={formData.bpharmYear2Percentage}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter percentage"
                            />
                          </div>
                        </div>
                      </div>

                      {/* BPharm Year 3 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">BPharm Year 3</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
                            <input
                              type="text"
                              name="bpharmYear3MarksObtained"
                              value={formData.bpharmYear3MarksObtained}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter marks obtained"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                            <input
                              type="text"
                              name="bpharmYear3MaxMarks"
                              value={formData.bpharmYear3MaxMarks}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter total marks"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                            <input
                              type="text"
                              name="bpharmYear3Percentage"
                              value={formData.bpharmYear3Percentage}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter percentage"
                            />
                          </div>
                        </div>
                      </div>

                      {/* BPharm Year 4 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">BPharm Year 4</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
                            <input
                              type="text"
                              name="bpharmYear4MarksObtained"
                              value={formData.bpharmYear4MarksObtained}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter marks obtained"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                            <input
                              type="text"
                              name="bpharmYear4MaxMarks"
                              value={formData.bpharmYear4MaxMarks}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter total marks"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                            <input
                              type="text"
                              name="bpharmYear4Percentage"
                              value={formData.bpharmYear4Percentage}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter percentage"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* BPharm Year Marksheets for MPharm applications */}
                {formData.courseType === 'mpharm' && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">BPharm Year Marksheets (Mandatory for MPharm)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BPharm Year 1 Marksheet *
                        </label>
                        <input
                          type="file"
                          name="bpharmYear1Marksheet"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload BPharm Year 1 marksheet (mandatory for MPharm)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BPharm Year 2 Marksheet *
                        </label>
                        <input
                          type="file"
                          name="bpharmYear2Marksheet"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload BPharm Year 2 marksheet (mandatory for MPharm)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BPharm Year 3 Marksheet *
                        </label>
                        <input
                          type="file"
                          name="bpharmYear3Marksheet"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload BPharm Year 3 marksheet (mandatory for MPharm)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BPharm Year 4 Marksheet *
                        </label>
                        <input
                          type="file"
                          name="bpharmYear4Marksheet"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload BPharm Year 4 marksheet (mandatory for MPharm)</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BPharm Degree <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        name="bpharmDegree"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload BPharm Degree (mandatory for MPharm)</p>
                    </div>
                  </div>
                )}

                {/* Additional Documents (Optional) */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Additional Documents (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Certificate
                      </label>
                      <input
                        type="file"
                        name="categoryCertificate"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload category certificate (optional)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        High School Certificate
                      </label>
                      <input
                        type="file"
                        name="highSchoolCertificate"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload high school certificate (optional)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        10+2 Certificate
                      </label>
                      <input
                        type="file"
                        name="intermediateCertificate"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload 10+2 certificate (optional)</p>
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

                {/* Disclaimer Checkbox */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="disclaimer"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                      required
                    />
                    <label htmlFor="disclaimer" className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Declaration:</span> I hereby declare that all the information provided in this application form is true, correct, and complete to the best of my knowledge. I understand that any false or misleading information may result in the rejection of my application or cancellation of admission if discovered later. I also confirm that I have read and understood all the instructions and terms of the application process.
                    </label>
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
                    disabled={loading || !disclaimerAccepted}
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