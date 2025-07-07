import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationAPI } from '../services/api';

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount] = useState(500); // Fixed application fee
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();

  const applicationId = location.state?.applicationId || params?.applicationId;

  const verifyPayment = useCallback(async (response) => {
    try {
      setLoading(true);
      setError('');

      const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          applicationId: applicationId
        })
      });

      const data = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      // Update application payment status
      await applicationAPI.updatePaymentStatus(applicationId, {
        paymentId: response.razorpay_payment_id,
        status: 'completed'
      });

      // Redirect to success page
      navigate('/payment-success', {
        state: {
          paymentId: response.razorpay_payment_id,
          applicationId: applicationId
        }
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError(error.message || 'Payment verification failed');
      navigate('/payment-failure', {
        state: {
          error: error.message,
          applicationId: applicationId
        }
      });
    } finally {
      setLoading(false);
    }
  }, [applicationId, navigate]);

  const createOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/payment/create-order`;
      console.log('Payment API URL:', apiUrl);
      console.log('Environment variable:', process.env.REACT_APP_API_URL);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt: `app_${applicationId}_${Date.now().toString().slice(-8)}`,
          notes: {
            applicationId: applicationId,
            userId: user._id
          }
        })
      });

      console.log('Payment request body:', {
        amount: amount,
        currency: 'INR',
        receipt: `app_${applicationId}_${Date.now()}`,
        notes: {
          applicationId: applicationId,
          userId: user._id
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Initialize Razorpay directly here
      const options = {
        key: 'rzp_live_JNqhifD5U57fhJ', // Live Razorpay key
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Selfky',
        description: 'Application Fee',
        order_id: data.order.id,
        handler: function (response) {
          verifyPayment(response);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#3B82F6'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.message || 'Failed to create payment order');
    } finally {
      setLoading(false);
    }
  }, [applicationId, user._id, amount, user.name, user.email, user.phone, verifyPayment]);

  const handleRetry = () => {
    setError('');
    createOrder();
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    console.log('Payment component - applicationId:', applicationId);
    console.log('Payment component - location.state:', location.state);
    console.log('Payment component - params:', params);
    
    if (!applicationId) {
      setError('No application found. Please submit an application first.');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    createOrder();
  }, [applicationId, user, navigate, location.state, params, createOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Processing Payment</h2>
            <p className="mt-2 text-gray-600">Please wait while we process your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Required</h2>
          <p className="mt-2 text-gray-600">Complete your application by paying the application fee</p>
        </div>

        <div className="mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Application Fee:</span>
              <span className="text-lg font-semibold text-gray-900">₹{amount}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleRetry}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Retry Payment
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 