import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationAPI } from '../services/api';

const ApplicationView = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const response = await applicationAPI.getApplicationById(applicationId);
      setApplication(response);
    } catch (error) {
      console.error('Error fetching application:', error);
      alert('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#101418] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#101418] mb-4">Application Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#101418] text-white py-2 px-4 rounded-lg hover:bg-[#2a2f36] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { personalDetails, documents, payment, courseType, applicationNumber, status } = application;

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

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#101418]">Application Details</h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">Application No.</p>
                <p className="font-semibold text-[#101418]">{applicationNumber}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                status === 'payment_pending' ? 'bg-orange-100 text-orange-800' :
                payment?.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'submitted' ? 'Submitted' :
                 status === 'payment_pending' ? 'Payment Pending' :
                 payment?.status === 'completed' ? 'Payment Completed' :
                 'Unknown Status'}
              </span>
            </div>

            <div className="space-y-8">
              {/* Personal Details Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#101418] mb-4">Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                    <p className="text-[#101418] font-medium">{personalDetails.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Father's/Husband's Name</label>
                    <p className="text-[#101418] font-medium">{personalDetails.fathersName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Aadhar Number</label>
                    <p className="text-[#101418] font-medium">{personalDetails.aadharNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                    <p className="text-[#101418] font-medium">{new Date(personalDetails.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Sex</label>
                    <p className="text-[#101418] font-medium">{personalDetails.sex}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nationality</label>
                    <p className="text-[#101418] font-medium">{personalDetails.nationality}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                    <p className="text-[#101418] font-medium">{personalDetails.category}</p>
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#101418] mb-4">Contact Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Address for Correspondence</label>
                    <p className="text-[#101418] font-medium">{personalDetails.correspondenceAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Permanent Address</label>
                    <p className="text-[#101418] font-medium">{personalDetails.permanentAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                    <p className="text-[#101418] font-medium">{personalDetails.correspondencePhone}</p>
                  </div>
                </div>
              </div>

              {/* Qualifying Examination Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#101418] mb-4">Qualifying Examination</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Examination</label>
                    <p className="text-[#101418] font-medium">{personalDetails.qualifyingExam}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <p className="text-[#101418] font-medium capitalize">{personalDetails.qualifyingExamStatus}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Board</label>
                    <p className="text-[#101418] font-medium">{personalDetails.qualifyingBoard}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Year of Passing</label>
                    <p className="text-[#101418] font-medium">{personalDetails.qualifyingYear}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Subjects</label>
                    <p className="text-[#101418] font-medium">{personalDetails.qualifyingSubjects}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Marks</label>
                    <p className="text-[#101418] font-medium">{personalDetails.qualifyingMarksObtained}/{personalDetails.qualifyingMaxMarks} ({personalDetails.qualifyingPercentage}%)</p>
                  </div>
                </div>
              </div>

              {/* High School Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#101418] mb-4">High School Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Board</label>
                    <p className="text-[#101418] font-medium">{personalDetails.highSchoolBoard}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Year of Passing</label>
                    <p className="text-[#101418] font-medium">{personalDetails.highSchoolYear}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Subjects</label>
                    <p className="text-[#101418] font-medium">{personalDetails.highSchoolSubjects}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Marks</label>
                    <p className="text-[#101418] font-medium">{personalDetails.highSchoolMarksObtained}/{personalDetails.highSchoolMaxMarks} ({personalDetails.highSchoolPercentage}%)</p>
                  </div>
                </div>
              </div>

              {/* Intermediate Subjects Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#101418] mb-4">Intermediate/Equivalent Exam Details</h3>
                <div className="space-y-4">
                  {personalDetails.intermediateSubjects && Object.entries(personalDetails.intermediateSubjects).map(([subject, marks]) => (
                    <div key={subject} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-[#101418] mb-3 capitalize">{subject}</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Marks Obtained</label>
                          <p className="text-[#101418] font-medium">{marks.marksObtained}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Maximum Marks</label>
                          <p className="text-[#101418] font-medium">{marks.maxMarks}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Percentage</label>
                          <p className="text-[#101418] font-medium">{marks.percentage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Place of Application */}
              <div className="border-b border-gray-200 pb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Place of Application</label>
                  <p className="text-[#101418] font-medium">{personalDetails.placeOfApplication}</p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#101418] mb-4">Documents</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Photo</label>
                    {documents?.photo && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <img 
                          src={`/uploads/${documents.photo}`} 
                          alt="Applicant Photo" 
                          className="w-32 h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Signature</label>
                    {documents?.signature && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <img 
                          src={`/uploads/${documents.signature}`} 
                          alt="Applicant Signature" 
                          className="w-32 h-20 object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {payment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-[#101418] mb-2">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-medium">{payment.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        payment.status === 'completed' ? 'text-green-600' :
                        payment.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    {payment.amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">₹{payment.amount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationView; 