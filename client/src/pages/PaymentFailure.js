import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaArrowLeft, FaRedo } from 'react-icons/fa';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorDetails, setErrorDetails] = useState(null);
  
  // Get error details from location state or URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const stateError = location.state?.error;
    const urlError = urlParams.get('error');
    const paymentId = urlParams.get('razorpay_payment_id');
    const orderId = urlParams.get('razorpay_order_id');
    
    setErrorDetails({
      error: stateError || urlError || 'Payment processing failed',
      paymentId: paymentId || location.state?.paymentId,
      orderId: orderId || location.state?.orderId,
      applicationId: location.state?.applicationId,
      timestamp: new Date().toLocaleString()
    });
  }, [location]);

  const handleRetry = () => {
    if (errorDetails?.applicationId) {
      navigate('/payment', {
        state: { applicationId: errorDetails.applicationId }
      });
    } else {
      navigate('/dashboard');
    }
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Payment Failure - Selfky Application');
    const body = encodeURIComponent(`
Dear Support Team,

I encountered a payment failure while processing my application.

Error Details:
- Error: ${errorDetails?.error || 'Unknown error'}
- Payment ID: ${errorDetails?.paymentId || 'Not available'}
- Order ID: ${errorDetails?.orderId || 'Not available'}
- Timestamp: ${errorDetails?.timestamp || 'Not available'}

Please assist me with resolving this issue.

Thank you.
    `);
    window.open(`mailto:support@selfky.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
            <FaTimesCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-lg text-gray-600">
            We couldn't process your payment. Don't worry, your application is safe.
          </p>
        </div>

        {/* Error Details */}
        {errorDetails && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <FaExclamationTriangle className="h-6 w-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Error Details
                </h3>
                <div className="space-y-2 text-sm text-red-700">
                  <p><strong>Error:</strong> {errorDetails.error}</p>
                  {errorDetails.paymentId && (
                    <p><strong>Payment ID:</strong> {errorDetails.paymentId}</p>
                  )}
                  {errorDetails.orderId && (
                    <p><strong>Order ID:</strong> {errorDetails.orderId}</p>
                  )}
                  <p><strong>Time:</strong> {errorDetails.timestamp}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What Happened */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                What Happened?
              </h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• Your payment was not processed successfully</p>
                <p>• Your application data is safe and unchanged</p>
                <p>• No charges have been made to your account</p>
                <p>• You can try the payment again</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <FaInfoCircle className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                What You Can Do:
              </h3>
              <div className="text-sm text-green-700 space-y-2">
                <p>• <strong>Try Again:</strong> Click "Retry Payment" to attempt payment again</p>
                <p>• <strong>Check Details:</strong> Verify your payment information</p>
                <p>• <strong>Different Method:</strong> Try using a different payment method</p>
                <p>• <strong>Contact Support:</strong> If the issue persists, contact our support team</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleRetry}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <FaRedo className="mr-2" />
            Retry Payment
          </button>
          <button
            onClick={handleDashboard}
            className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <FaArrowLeft className="mr-2" />
            Go to Dashboard
          </button>
        </div>

        {/* Support Contact */}
        <div className="text-center border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-600 mb-2">
            Need immediate assistance?
          </p>
          <button
            onClick={handleContactSupport}
            className="text-blue-600 hover:text-blue-500 font-medium text-sm underline"
          >
            Contact Support
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Email: support@selfky.com | Phone: +91-XXXXXXXXXX
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure; 