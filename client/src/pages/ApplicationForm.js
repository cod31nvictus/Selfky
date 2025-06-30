import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ApplicationForm = () => {
  const { courseType } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    fathersName: '',
    category: 'General',
    dateOfBirth: '',
    photo: null,
    signature: null
  });

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
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate form data
      if (!formData.fullName || !formData.fathersName || !formData.dateOfBirth || !formData.photo || !formData.signature) {
        alert('Please fill all required fields and upload both photo and signature');
        return;
      }
      // Navigate to payment page with form data
      navigate('/payment', {
        state: {
          formData: formData,
          courseInfo: courseInfo[courseType],
          feeAmount: getApplicationFee(),
          courseType: courseType
        }
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const getApplicationFee = () => {
    return feeStructure[courseType][formData.category];
  };

  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-[#101418] mb-6">Personal Details</h2>
        
        <div className="space-y-6">
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
            />
          </div>

          {/* Father's Name */}
          <div>
            <label className="block text-sm font-medium text-[#101418] mb-2">
              Father's Name *
            </label>
            <input
              type="text"
              name="fathersName"
              value={formData.fathersName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101418] focus:border-transparent"
              placeholder="Enter your father's name"
              required
            />
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
            >
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="PH">PH</option>
            </select>
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
            />
          </div>

          {/* File Uploads */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-[#101418] mb-2">
                Passport Size Photo *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#101418] transition-colors">
                <input
                  type="file"
                  name="photo"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                  required
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.photo ? formData.photo.name : 'Click to upload photo'}
                  </p>
                </label>
              </div>
            </div>

            {/* Signature Upload */}
            <div>
              <label className="block text-sm font-medium text-[#101418] mb-2">
                Signature *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#101418] transition-colors">
                <input
                  type="file"
                  name="signature"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="signature-upload"
                  required
                />
                <label htmlFor="signature-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.signature ? formData.signature.name : 'Click to upload signature'}
                  </p>
                </label>
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
            className="bg-[#101418] text-white py-3 px-8 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors"
          >
            Proceed to Payment
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
          <div className="flex items-center justify-center">
            <div className="flex items-center text-[#101418]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#101418] text-white">
                1
              </div>
              <span className="ml-2 font-medium">Personal Details</span>
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