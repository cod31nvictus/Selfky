import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { applicationAPI } from '../services/api';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [completedSteps, setCompletedSteps] = useState([1]);

  useEffect(() => {
    // Get payment data from location state (passed from application form)
    if (location.state) {
      setPaymentData(location.state);
    }
  }, [location]);

  const handlePaymentSimulation = async (status) => {
    setLoading(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update payment status in database
      if (paymentData.applicationId) {
        await applicationAPI.updatePaymentStatus(paymentData.applicationId, {
          status: status === 'success' ? 'completed' : status === 'failure' ? 'failed' : 'cancelled',
          transactionId: status === 'success' ? 'TXN' + Date.now() : null
        });
      }
      
      setLoading(false);
      
      if (status === 'success') {
        // Mark payment step as completed
        setCompletedSteps(prev => [...prev, 2]);
        // Redirect to admit card generation (step 3)
        navigate('/admit-card', { 
          state: { 
            ...paymentData, 
            paymentStatus: 'success',
            transactionId: 'TXN' + Date.now(),
            completedSteps: [1, 2]
          } 
        });
      } else if (status === 'failure') {
        navigate('/payment/failure', { 
          state: { 
            ...paymentData, 
            paymentStatus: 'failed',
            errorMessage: 'Payment failed due to insufficient funds'
          } 
        });
      } else if (status === 'cancel') {
        navigate('/payment/cancel', { 
          state: { 
            ...paymentData, 
            paymentStatus: 'cancelled'
          } 
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      setLoading(false);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const handleStepClick = (step) => {
    // Allow navigation to completed steps or current step
    if (completedSteps.includes(step) || step === currentStep) {
      if (step === 1) {
        // Navigate back to application form
        navigate('/apply/' + paymentData?.courseType, {
          state: { 
            formData: paymentData?.formData,
            completedSteps: completedSteps,
            applicationId: paymentData?.applicationId
          }
        });
      } else {
        setCurrentStep(step);
      }
    }
  };

  const isStepCompleted = (step) => {
    return completedSteps.includes(step);
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#101418] mb-4">No Payment Data Found</h2>
          <p className="text-[#5c728a] mb-4">Please start the application process from the dashboard.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-[#101418] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a2f36] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          <span className="text-[#101418] text-sm font-medium">Payment Gateway</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className={`flex items-center cursor-pointer transition-colors ${isStepCompleted(1) ? 'text-green-600' : 'text-gray-400'}`}
              onClick={() => handleStepClick(1)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isStepCompleted(1) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {isStepCompleted(1) ? '✓' : '1'}
              </div>
              <span className="ml-2 font-medium">Personal Details</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div className={`h-full transition-all duration-300 ${isStepCompleted(1) ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'}`}></div>
            </div>
            <div 
              className={`flex items-center cursor-pointer transition-colors ${currentStep === 2 ? 'text-[#101418]' : 'text-gray-400'}`}
              onClick={() => handleStepClick(2)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-[#101418] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div className="h-full bg-gray-200 w-0"></div>
            </div>
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                3
              </div>
              <span className="ml-2 font-medium">Admit Card</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-[#101418] mb-6">Payment Gateway</h2>
            
            {/* Payment Information */}
            <div className="space-y-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#101418] mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm text-[#5c728a]">
                  <p><strong>Application Number:</strong> {paymentData.applicationNumber}</p>
                  <p><strong>Course:</strong> {paymentData.courseInfo?.fullName}</p>
                  <p><strong>Applicant:</strong> {paymentData.formData?.fullName}</p>
                  <p><strong>Category:</strong> {paymentData.formData?.category}</p>
                  <p><strong>Amount:</strong> ₹{paymentData.feeAmount}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-[#101418] mb-2">Payment Simulation</h3>
                <p className="text-sm text-[#5c728a] mb-4">
                  This is a simulation of the payment gateway. Click any button below to simulate different payment scenarios.
                </p>
              </div>
            </div>

            {/* Payment Simulation Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => handlePaymentSimulation('success')}
                disabled={loading}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Simulate Payment Success'}
              </button>

              <button
                onClick={() => handlePaymentSimulation('failure')}
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Simulate Payment Failure'}
              </button>

              <button
                onClick={() => handlePaymentSimulation('cancel')}
                disabled={loading}
                className="w-full bg-yellow-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Simulate Payment Cancellation'}
              </button>
            </div>

            {/* Back Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-300 text-[#101418] py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Back to Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 