import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { applicationAPI } from '../services/api';

const ApplicationForm = () => {
  const { courseType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    fathersName: '',
    aadharNumber: '',
    dateOfBirth: '',
    sex: '',
    nationality: 'Indian',
    
    // Contact Details
    correspondenceAddress: '',
    permanentAddress: '',
    correspondencePhone: '',
    
    // Education Details
    qualifyingExam: '',
    qualifyingExamStatus: 'passed', // passed or appearing
    qualifyingBoard: '',
    qualifyingYear: '',
    qualifyingSubjects: '',
    qualifyingMarksObtained: '',
    qualifyingMaxMarks: '',
    qualifyingPercentage: '',
    
    // High School Details
    highSchoolBoard: '',
    highSchoolYear: '',
    highSchoolSubjects: '',
    highSchoolMarksObtained: '',
    highSchoolMaxMarks: '',
    highSchoolPercentage: '',
    
    // Intermediate/Equivalent Exam Details
    intermediateSubjects: {
      physics: { marksObtained: '', maxMarks: '', percentage: '' },
      chemistry: { marksObtained: '', maxMarks: '', percentage: '' },
      biology: { marksObtained: '', maxMarks: '', percentage: '' },
      zoology: { marksObtained: '', maxMarks: '', percentage: '' },
      botany: { marksObtained: '', maxMarks: '', percentage: '' },
      english: { marksObtained: '', maxMarks: '', percentage: '' }
    },
    
    // Application Details
    placeOfApplication: '',
    category: 'General',
    photo: null,
    signature: null
  });
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);

  useEffect(() => {
    checkExistingApplication();
  }, [courseType]);

  useEffect(() => {
    // Check if we're returning from payment page with completed steps
    if (location.state?.completedSteps) {
      setCompletedSteps(location.state.completedSteps);
    }
    if (location.state?.formData) {
      setFormData(location.state.formData);
    }
    if (location.state?.applicationId) {
      setApplicationId(location.state.applicationId);
    }
  }, [location]);

  const checkExistingApplication = async () => {
    try {
      const applications = await applicationAPI.getMyApplications();
      const existing = applications.find(app => app.courseType === courseType);
      
      if (existing) {
        setExistingApplication(existing);
        setApplicationId(existing._id);
        
        // Load existing data
        if (existing.personalDetails) {
          setFormData(prev => ({
            ...prev,
            fullName: existing.personalDetails.fullName || '',
            fathersName: existing.personalDetails.fathersName || '',
            aadharNumber: existing.personalDetails.aadharNumber || '',
            dateOfBirth: existing.personalDetails.dateOfBirth ? new Date(existing.personalDetails.dateOfBirth).toISOString().split('T')[0] : '',
            sex: existing.personalDetails.sex || '',
            nationality: existing.personalDetails.nationality || 'Indian',
            correspondenceAddress: existing.personalDetails.correspondenceAddress || '',
            permanentAddress: existing.personalDetails.permanentAddress || '',
            correspondencePhone: existing.personalDetails.correspondencePhone || '',
            qualifyingExam: existing.personalDetails.qualifyingExam || '',
            qualifyingExamStatus: existing.personalDetails.qualifyingExamStatus || 'passed',
            qualifyingBoard: existing.personalDetails.qualifyingBoard || '',
            qualifyingYear: existing.personalDetails.qualifyingYear || '',
            qualifyingSubjects: existing.personalDetails.qualifyingSubjects || '',
            qualifyingMarksObtained: existing.personalDetails.qualifyingMarksObtained || '',
            qualifyingMaxMarks: existing.personalDetails.qualifyingMaxMarks || '',
            qualifyingPercentage: existing.personalDetails.qualifyingPercentage || '',
            highSchoolBoard: existing.personalDetails.highSchoolBoard || '',
            highSchoolYear: existing.personalDetails.highSchoolYear || '',
            highSchoolSubjects: existing.personalDetails.highSchoolSubjects || '',
            highSchoolMarksObtained: existing.personalDetails.highSchoolMarksObtained || '',
            highSchoolMaxMarks: existing.personalDetails.highSchoolMaxMarks || '',
            highSchoolPercentage: existing.personalDetails.highSchoolPercentage || '',
            intermediateSubjects: existing.personalDetails.intermediateSubjects || {
              physics: { marksObtained: '', maxMarks: '', percentage: '' },
              chemistry: { marksObtained: '', maxMarks: '', percentage: '' },
              biology: { marksObtained: '', maxMarks: '', percentage: '' },
              zoology: { marksObtained: '', maxMarks: '', percentage: '' },
              botany: { marksObtained: '', maxMarks: '', percentage: '' },
              english: { marksObtained: '', maxMarks: '', percentage: '' }
            },
            placeOfApplication: existing.personalDetails.placeOfApplication || '',
            category: existing.personalDetails.category || 'General',
            photo: null, // We can't load files from server, but we can show they exist
            signature: null
          }));
        }

        // Set completed steps based on application status
        const steps = [1]; // Step 1 is always completed if application exists
        if (existing.payment?.status === 'completed') {
          steps.push(2, 3);
        } else if (existing.status === 'submitted' || existing.status === 'payment_pending') {
          steps.push(2);
        }
        setCompletedSteps(steps);

        // If payment is completed, redirect to admit card
        if (existing.payment?.status === 'completed') {
          navigate(`/admit-card/${existing._id}`);
          return;
        }

        // If application exists but payment is pending, go to payment step
        if (existing.status === 'submitted' || existing.status === 'payment_pending') {
          setCurrentStep(2);
        }
      }
    } catch (error) {
      console.error('Error checking existing application:', error);
    }
  };

  // Fee structure
  const feeStructure = {
    bpharm: {
      General: 1000,
      OBC: 800,
      SC: 800,
      ST: 800,
      PH: 800
    },
    mpharm: {
      General: 1200,
      OBC: 1000,
      SC: 1000,
      ST: 1000,
      PH: 1000
    }
  };

  const courseInfo = {
    bpharm: {
      name: 'BPharm (Ay.) 2025',
      fullName: 'Bachelor of Pharmacy (Ayurveda) 2025'
    },
    mpharm: {
      name: 'MPharm (Ay.) 2025',
      fullName: 'Master of Pharmacy (Ayurveda) 2025'
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
      // Check file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        alert(`File too large! ${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please use a file under 2MB.`);
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type! Please use JPG, PNG, or PDF format.`);
        e.target.value = ''; // Clear the input
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate form data - only check fields that backend expects
      if (!formData.fullName || !formData.fathersName || !formData.dateOfBirth || 
          !formData.category || !formData.photo || !formData.signature) {
        alert('Please fill all required fields and upload both photo and signature');
        return;
      }

      setLoading(true);
      try {
        // Prepare data for API - only send fields that backend expects
        const apiData = {
          courseType: courseType,
          fullName: formData.fullName,
          fathersName: formData.fathersName,
          category: formData.category,
          dateOfBirth: formData.dateOfBirth,
          photo: formData.photo,
          signature: formData.signature
        };

        // Create application in database
        const response = await applicationAPI.createApplication(apiData);
        
        // Mark step as completed
        setCompletedSteps(prev => [...prev, 1]);
        setApplicationId(response._id);

        // Navigate to payment page with form data and application ID
        navigate('/payment', {
          state: {
            formData: formData,
            courseInfo: courseInfo[courseType],
            feeAmount: getApplicationFee(),
            courseType: courseType,
            applicationId: response._id,
            applicationNumber: response.applicationNumber
          }
        });
      } catch (error) {
        console.error('Error creating application:', error);
        
        // Handle different types of errors with specific messages
        if (error.message && error.message.includes('413')) {
          alert('File size too large! Please ensure:\n\n• Photo file is under 2MB\n• Signature file is under 2MB\n• Use JPG, PNG, or PDF format\n\nPlease compress your files and try again.');
        } else if (error.message && error.message.includes('Unexpected token')) {
          alert('Server error occurred. Please try again in a few moments.');
        } else if (error.message && error.message.includes('Failed to fetch')) {
          alert('Network error. Please check your internet connection and try again.');
        } else {
          alert('Failed to create application. Please ensure all required fields are filled and try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStepClick = (step) => {
    // Only allow navigation to current step or next step
    // Don't allow going back to completed steps for editing
    if (step === currentStep || step === currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const getApplicationFee = () => {
    return feeStructure[courseType][formData.category];
  };

  const isStepCompleted = (step) => {
    return completedSteps.includes(step);
  };

  const isStepEditable = (step) => {
    // Only allow editing the current step, not completed steps
    return step === currentStep;
  };

  const handleIntermediateSubjectChange = (subject, field, value) => {
    setFormData(prev => ({
      ...prev,
      intermediateSubjects: {
        ...prev.intermediateSubjects,
        [subject]: {
          ...prev.intermediateSubjects[subject],
          [field]: value
        }
      }
    }));
  };

  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-[#101418] mb-6">Application Form</h2>
        
        <div className="space-y-8">
          {/* Personal Details Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-[#101418] mb-4">Personal Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Father's/Husband's Name */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Father's/Husband's Name *
                </label>
                <input
                  type="text"
                  name="fathersName"
                  value={formData.fathersName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter father's or husband's name"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Aadhar Number */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  12 Digit Aadhar Number *
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter 12 digit Aadhar number"
                  maxLength="12"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Sex */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Sex *
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  required
                  disabled={!isStepEditable(1) || loading}
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Nationality *
                </label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  required
                  disabled={!isStepEditable(1) || loading}
                >
                  <option value="Indian">Indian</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  required
                  disabled={!isStepEditable(1) || loading}
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="PH">PH</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-[#101418] mb-4">Contact Details</h3>
            <div className="space-y-6">
              {/* Correspondence Address */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Address for Correspondence *
                </label>
                <textarea
                  name="correspondenceAddress"
                  value={formData.correspondenceAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter your correspondence address"
                  rows="3"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Permanent Address */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Permanent Address *
                </label>
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter your permanent address"
                  rows="3"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              <div>
                {/* Correspondence Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#101418] mb-2">
                    Correspondence Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="correspondencePhone"
                    value={formData.correspondencePhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                    placeholder="Enter 10-digit phone number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    required
                    disabled={!isStepEditable(1) || loading}
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter exactly 10 digits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualifying Examination Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-[#101418] mb-4">Qualifying Examination (I.Sc./10+2 equivalent)</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Qualifying Exam */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Qualifying Examination *
                </label>
                <input
                  type="text"
                  name="qualifyingExam"
                  value={formData.qualifyingExam}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="e.g., I.Sc., 10+2, etc."
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Exam Status */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Status *
                </label>
                <select
                  name="qualifyingExamStatus"
                  value={formData.qualifyingExamStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  required
                  disabled={!isStepEditable(1) || loading}
                >
                  <option value="passed">Passed</option>
                  <option value="appearing">Appearing</option>
                </select>
              </div>

              {/* Board */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Board *
                </label>
                <input
                  type="text"
                  name="qualifyingBoard"
                  value={formData.qualifyingBoard}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter board name"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Year of Passing */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Year of Passing *
                </label>
                <input
                  type="number"
                  name="qualifyingYear"
                  value={formData.qualifyingYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="e.g., 2023"
                  min="1990"
                  max="2030"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Subjects *
                </label>
                <input
                  type="text"
                  name="qualifyingSubjects"
                  value={formData.qualifyingSubjects}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter subjects"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Marks Obtained */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Marks Obtained *
                </label>
                <input
                  type="number"
                  name="qualifyingMarksObtained"
                  value={formData.qualifyingMarksObtained}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter marks obtained"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Max Marks */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Maximum Marks *
                </label>
                <input
                  type="number"
                  name="qualifyingMaxMarks"
                  value={formData.qualifyingMaxMarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter maximum marks"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Percentage *
                </label>
                <input
                  type="number"
                  name="qualifyingPercentage"
                  value={formData.qualifyingPercentage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter percentage"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>
            </div>
          </div>

          {/* High School Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-[#101418] mb-4">High School Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* High School Board */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  High School Board *
                </label>
                <input
                  type="text"
                  name="highSchoolBoard"
                  value={formData.highSchoolBoard}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter board name"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* High School Year */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Year of Passing *
                </label>
                <input
                  type="number"
                  name="highSchoolYear"
                  value={formData.highSchoolYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="e.g., 2021"
                  min="1990"
                  max="2030"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* High School Subjects */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Subjects *
                </label>
                <input
                  type="text"
                  name="highSchoolSubjects"
                  value={formData.highSchoolSubjects}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter subjects"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* High School Marks Obtained */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Marks Obtained *
                </label>
                <input
                  type="number"
                  name="highSchoolMarksObtained"
                  value={formData.highSchoolMarksObtained}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter marks obtained"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* High School Max Marks */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Maximum Marks *
                </label>
                <input
                  type="number"
                  name="highSchoolMaxMarks"
                  value={formData.highSchoolMaxMarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter maximum marks"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>

              {/* High School Percentage */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Percentage *
                </label>
                <input
                  type="number"
                  name="highSchoolPercentage"
                  value={formData.highSchoolPercentage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                  placeholder="Enter percentage"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  disabled={!isStepEditable(1) || loading}
                />
              </div>
            </div>
          </div>

          {/* Intermediate/Equivalent Exam Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-[#101418] mb-4">Marks Details for Intermediate or Equivalent Exam</h3>
            <div className="space-y-4">
              {Object.entries(formData.intermediateSubjects).map(([subject, marks]) => (
                <div key={subject} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-[#101418] mb-3 capitalize">{subject}</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#101418] mb-2">
                        Marks Obtained
                      </label>
                      <input
                        type="number"
                        value={marks.marksObtained}
                        onChange={(e) => handleIntermediateSubjectChange(subject, 'marksObtained', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                        placeholder="Marks obtained"
                        disabled={!isStepEditable(1) || loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#101418] mb-2">
                        Maximum Marks
                      </label>
                      <input
                        type="number"
                        value={marks.maxMarks}
                        onChange={(e) => handleIntermediateSubjectChange(subject, 'maxMarks', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                        placeholder="Maximum marks"
                        disabled={!isStepEditable(1) || loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#101418] mb-2">
                        Percentage
                      </label>
                      <input
                        type="number"
                        value={marks.percentage}
                        onChange={(e) => handleIntermediateSubjectChange(subject, 'percentage', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                        placeholder="Percentage"
                        step="0.01"
                        min="0"
                        max="100"
                        disabled={!isStepEditable(1) || loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Place of Application */}
          <div className="border-b border-gray-200 pb-6">
            <div>
              <label className="block text-sm font-medium text-[#101418] mb-2">
                Place of Application *
              </label>
              <input
                type="text"
                name="placeOfApplication"
                value={formData.placeOfApplication}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
                placeholder="Enter place of application"
                required
                disabled={!isStepEditable(1) || loading}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-[#101418] mb-4">Documents</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Passport Size Photo *
                </label>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#101418] transition-colors ${!isStepEditable(1) || loading ? 'opacity-50' : ''}`}>
                  <input
                    type="file"
                    name="photo"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    required
                    disabled={!isStepEditable(1) || loading}
                  />
                  <label htmlFor="photo-upload" className={`cursor-pointer ${!isStepEditable(1) || loading ? 'pointer-events-none' : ''}`}>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {formData.photo ? formData.photo.name : 
                       (existingApplication?.documents?.photo ? 'Photo uploaded ✓' : 'Click to upload photo')}
                    </p>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  📁 Max size: 2MB | Formats: JPG, PNG, PDF
                </p>
              </div>

              {/* Signature Upload */}
              <div>
                <label className="block text-sm font-medium text-[#101418] mb-2">
                  Signature *
                </label>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#101418] transition-colors ${!isStepEditable(1) || loading ? 'opacity-50' : ''}`}>
                  <input
                    type="file"
                    name="signature"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="signature-upload"
                    required
                    disabled={!isStepEditable(1) || loading}
                  />
                  <label htmlFor="signature-upload" className={`cursor-pointer ${!isStepEditable(1) || loading ? 'pointer-events-none' : ''}`}>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {formData.signature ? formData.signature.name : 
                       (existingApplication?.documents?.signature ? 'Signature uploaded ✓' : 'Click to upload signature')}
                    </p>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  📁 Max size: 2MB | Formats: JPG, PNG, PDF
                </p>
              </div>
            </div>
          </div>

          {/* Fee Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-[#101418] mb-2">Application Fee</h3>
            <div className="flex justify-between items-center">
              <span className="text-[#5c728a]">Fee Amount ({formData.category} Category):</span>
              <span className="text-2xl font-bold text-[#101418]">₹{getApplicationFee()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={loading}
            className="bg-[#101418] text-white py-3 px-8 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );

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
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#eaedf1] text-[#101418] text-sm font-medium hover:bg-[#d4dbe2] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className={`flex items-center ${isStepCompleted(1) ? 'text-green-600' : currentStep === 1 ? 'text-[#101418] cursor-pointer' : 'text-gray-400'}`}
              onClick={() => isStepCompleted(1) ? null : handleStepClick(1)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isStepCompleted(1) ? 'bg-green-600 text-white' : currentStep === 1 ? 'bg-[#101418] text-white' : 'bg-gray-200'}`}>
                {isStepCompleted(1) ? '✓' : '1'}
              </div>
              <span className="ml-2 font-medium">Personal Details</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div className={`h-full transition-all duration-300 ${isStepCompleted(1) ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'}`}></div>
            </div>
            <div className={`flex items-center ${isStepCompleted(2) ? 'text-green-600' : currentStep === 2 ? 'text-[#101418] cursor-pointer' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isStepCompleted(2) ? 'bg-green-600 text-white' : currentStep === 2 ? 'bg-[#101418] text-white' : 'bg-gray-200'}`}>
                {isStepCompleted(2) ? '✓' : '2'}
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div className={`h-full transition-all duration-300 ${isStepCompleted(2) ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'}`}></div>
            </div>
            <div className={`flex items-center ${isStepCompleted(3) ? 'text-green-600' : currentStep === 3 ? 'text-[#101418] cursor-pointer' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isStepCompleted(3) ? 'bg-green-600 text-white' : currentStep === 3 ? 'bg-[#101418] text-white' : 'bg-gray-200'}`}>
                {isStepCompleted(3) ? '✓' : '3'}
              </div>
              <span className="ml-2 font-medium">Admit Card</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        {renderStep1()}
      </div>
    </div>
  );
};

export default ApplicationForm;