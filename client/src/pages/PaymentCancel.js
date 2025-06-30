import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentCancel = () => {
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
          <span className="text-[#101418] text-sm font-medium">Payment Cancelled</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Cancellation Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#101418] mb-2">Payment Cancelled</h2>
              <p className="text-[#5c728a]">Your payment was cancelled. No charges have been made to your account.</p>
            </div>

            {/* Payment Details */}
            {paymentData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-[#101418] mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Course:</strong> {paymentData.courseInfo?.fullName}</p>
                  <p><strong>Applicant:</strong> {paymentData.formData?.fullName}</p>
                  <p><strong>Amount:</strong> ₹{paymentData.feeAmount}</p>
                  <p><strong>Status:</strong> <span className="text-yellow-600">Cancelled</span></p>
                </div>
              </div>
            )}

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-[#101418] mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-[#5c728a]">
                <li>• Your application data has been saved</li>
                <li>• You can complete the payment anytime</li>
                <li>• No charges have been made to your account</li>
                <li>• You can try payment again or contact support</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => navigate('/payment', { state: paymentData })}
                className="w-full bg-[#101418] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors"
              >
                Complete Payment Now
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

export default PaymentCancel; 