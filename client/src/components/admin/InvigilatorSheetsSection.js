import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const InvigilatorSheetsSection = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bpharm');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getApplications();
      // Only get completed applications (payment completed)
      const completedApps = response.filter(app => app.payment?.status === 'completed');
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
      return `https://selfky-applications-2025.s3.eu-north-1.amazonaws.com/${path}`;
    }
    
    // If it's a local path, extract filename and construct S3 URL (fallback)
    const filename = path.split('/').pop();
    return `https://selfky-applications-2025.s3.eu-north-1.amazonaws.com/${filename}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'bpharm') return app.courseType === 'bpharm';
    if (activeTab === 'mpharm') return app.courseType === 'mpharm';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invigilator Verification Sheets</h2>
        <p className="text-gray-600">
          Download and print verification sheets for exam day. Each sheet contains applicant information, photos, and signature verification boxes.
        </p>
      </div>

      {/* Course Tabs */}
      <div className="mb-6 print:hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('bpharm')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bpharm'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              BPharm ({applications.filter(app => app.courseType === 'bpharm').length} applicants)
            </button>
            <button
              onClick={() => setActiveTab('mpharm')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mpharm'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              MPharm ({applications.filter(app => app.courseType === 'mpharm').length} applicants)
            </button>
          </nav>
        </div>
      </div>

      {/* Print Button */}
      <div className="mb-6 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          🖨️ Print Verification Sheet
        </button>
      </div>

      {/* Verification Sheet */}
      <div className="print:block">
        {/* Sheet Header */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">INVIGILATOR VERIFICATION SHEET</h1>
          <p className="text-xl text-gray-700 print:text-lg">
            {activeTab === 'bpharm' ? 'Bachelor of Pharmacy (Ayurveda) 2025' : 'Master of Pharmacy (Ayurveda) 2025'}
          </p>
          <p className="text-lg text-gray-600 print:text-base">Examination Date: 31-08-2025</p>
          <p className="text-base text-gray-500 print:text-sm">Center: NLT Institute of Medical Sciences BHU</p>
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
              {filteredApplications.map((application, index) => (
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

                  {/* Photo & Signature */}
                  <td className="border border-gray-300 px-4 py-3 text-sm">
                    <div className="space-y-4">
                      {/* Photo */}
                      <div>
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
                      <div>
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

export default InvigilatorSheetsSection;
