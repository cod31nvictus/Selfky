import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const InvigilatorSheetPage = () => {
  const { courseType } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [courseType]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getApplications();
      
      // Get all applications with completed payment (check multiple possible status values)
      const completedApps = response.filter(app => {
        const paymentStatus = app.payment?.status;
        return (paymentStatus === 'completed' || 
                paymentStatus === 'payment_completed' || 
                paymentStatus === 'success') && 
               app.courseType === courseType;
      });
      
      setApplications(completedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

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
      return `https://selfky-applications-2025.s3.eu-north-1.amazonaws.com/${filename}`;
    }
    
    // If it's a local path, extract filename and construct S3 URL (fallback)
    const filename = path.split('/').pop();
    return `https://selfky-applications-2025.s3.eu-north-1.amazonaws.com/${filename}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  const getCourseTitle = () => {
    return courseType === 'bpharm' ? 'Bachelor of Pharmacy (Ayurveda) 2025' : 'Master of Pharmacy (Ayurveda) 2025';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Print Button - Only visible when not printing */}
      <div className="p-4 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          🖨️ Print Verification Sheet
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="ml-4 bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          ← Back to Admin Panel
        </button>
      </div>

      {/* Verification Sheet */}
      <div className="print:block px-6 py-4">
        {/* Sheet Header */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">INVIGILATOR VERIFICATION SHEET</h1>
          <p className="text-xl text-gray-700 print:text-lg">{getCourseTitle()}</p>
          <p className="text-lg text-gray-600 print:text-base">Examination Date: 31-08-2025</p>
          <p className="text-base text-gray-500 print:text-sm">Center: NLT Institute of Medical Sciences BHU</p>
          <p className="text-base text-gray-500 print:text-sm">Total Applicants: {applications.length}</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 w-1/3">
                  Applicant Information
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 w-1/3">
                  Photo & Signature
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 w-1/3">
                  Verification Signature
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application, index) => (
                <tr key={application._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* Applicant Information */}
                  <td className="border border-gray-300 px-4 py-3 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Application Number:</span>
                        <span className="ml-2 font-semibold text-gray-900">{application.applicationNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Full Name:</span>
                        <span className="ml-2 font-semibold text-gray-900">{application.personalDetails?.fullName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Father's Name:</span>
                        <span className="ml-2 font-semibold text-gray-900">{application.personalDetails?.fathersName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <span className="ml-2 font-semibold text-gray-900">{application.personalDetails?.category}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date of Birth:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {formatDate(application.personalDetails?.dateOfBirth)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Photo & Signature - Side by Side */}
                  <td className="border border-gray-300 px-4 py-3 text-sm">
                    <div className="flex items-start space-x-4">
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        <p className="font-medium text-gray-700 mb-2">Photo:</p>
                        {application.documents?.photo ? (
                          <div className="w-20 h-24 border border-gray-300 rounded overflow-hidden bg-gray-100">
                            <img
                              src={getImageUrl(application.documents.photo)}
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
                        ) : (
                          <div className="w-20 h-24 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Photo</span>
                          </div>
                        )}
                      </div>

                      {/* Signature */}
                      <div className="flex-shrink-0">
                        <p className="font-medium text-gray-700 mb-2">Signature:</p>
                        {application.documents?.signature ? (
                          <div className="w-32 h-16 border border-gray-300 rounded overflow-hidden bg-gray-100">
                            <img
                              src={getImageUrl(application.documents.signature)}
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
                        ) : (
                          <div className="w-32 h-16 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Signature</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Verification Signature Box */}
                  <td className="border border-gray-300 px-4 py-3 text-sm">
                    <div className="h-full flex flex-col justify-center">
                      <p className="font-medium text-gray-700 mb-2 text-center">Verification Signature</p>
                      <div className="border-2 border-dashed border-gray-400 rounded-lg h-32 flex items-center justify-center bg-gray-50">
                        <span className="text-gray-500 text-sm">Applicant to sign here</span>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Match with uploaded signature above
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Instructions */}
        <div className="mt-8 print:mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Instructions for Invigilators:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Verify applicant identity by comparing photo with the person</li>
            <li>• Match the applicant's signature on the verification box with the uploaded signature</li>
            <li>• Check that all information matches the applicant's ID proof</li>
            <li>• Mark attendance and collect the verification sheet after exam</li>
          </ul>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          .print\\:text-lg {
            font-size: 1.125rem !important;
          }
          .print\\:text-base {
            font-size: 1rem !important;
          }
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvigilatorSheetPage;
