import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentData = location.state;

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
          <span className="text-[#101418] text-sm font-medium">Payment Failed</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Failure Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#101418] mb-2">Payment Failed</h2>
              <p className="text-[#5c728a]">We're sorry, but your payment could not be processed.</p>
            </div>

            {/* Error Details */}
            {paymentData && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Course:</strong> {paymentData.courseInfo?.fullName}</p>
                  <p><strong>Applicant:</strong> {paymentData.formData?.fullName}</p>
                  <p><strong>Amount:</strong> ₹{paymentData.feeAmount}</p>
                  <p><strong>Error:</strong> {paymentData.errorMessage || 'Payment processing failed'}</p>
                </div>
              </div>
            )}

            {/* Possible Reasons */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-[#101418] mb-2">Possible Reasons</h3>
              <ul className="space-y-2 text-sm text-[#5c728a]">
                <li>• Insufficient funds in your account</li>
                <li>• Incorrect card details</li>
                <li>• Network connectivity issues</li>
                <li>• Bank server temporarily unavailable</li>
                <li>• Transaction timeout</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => navigate('/payment', { state: paymentData })}
                className="w-full bg-[#101418] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors"
              >
                Try Payment Again
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-300 text-[#101418] py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Support Information */}
            <div className="mt-8 text-center">
              <p className="text-sm text-[#5c728a] mb-2">Need help? Contact our support team</p>
              <p className="text-sm text-[#101418] font-medium">support@selfky.com | +91-1234567890</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure; 