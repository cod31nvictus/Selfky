import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaPrint, FaArrowLeft } from 'react-icons/fa';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment details from URL parameters or location state
    const urlParams = new URLSearchParams(location.search);
    const paymentId = urlParams.get('razorpay_payment_id');
    const orderId = urlParams.get('razorpay_order_id');
    const signature = urlParams.get('razorpay_signature');
    const applicationId = urlParams.get('applicationId');

    // Check if we have payment details from location state (from Payment component)
    if (location.state) {
      setPaymentDetails({
        paymentId: location.state.paymentId,
        orderId: location.state.orderId,
        signature: location.state.signature,
        applicationId: location.state.applicationId
      });
    } else if (paymentId && orderId && signature) {
      // Fallback to URL parameters
      setPaymentDetails({
        paymentId,
        orderId,
        signature,
        applicationId
      });
    }
    setLoading(false);
  }, [location]);

  const handleDownloadAdmitCard = () => {
    if (paymentDetails?.applicationId) {
      navigate(`/admit-card/${paymentDetails.applicationId}`);
    }
  };

  const handlePrintAdmitCard = () => {
    if (paymentDetails?.applicationId) {
      window.open(`/admit-card/${paymentDetails.applicationId}?print=true`, '_blank');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="success-card">
        <div className="success-icon">
          <FaCheckCircle />
        </div>
        
        <h1>Payment Successful!</h1>
        <p className="success-message">
          Your application has been submitted successfully and payment has been processed.
        </p>

        {paymentDetails && (
          <div className="payment-details">
            <h3>Payment Details</h3>
            <div className="detail-item">
              <span className="label">Payment ID:</span>
              <span className="value">{paymentDetails.paymentId}</span>
            </div>
            <div className="detail-item">
              <span className="label">Order ID:</span>
              <span className="value">{paymentDetails.orderId}</span>
            </div>
            {paymentDetails.applicationId && (
              <div className="detail-item">
                <span className="label">Application ID:</span>
                <span className="value">{paymentDetails.applicationId}</span>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={handleDownloadAdmitCard}
          >
            <FaDownload /> Download Admit Card
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handlePrintAdmitCard}
          >
            <FaPrint /> Print Admit Card
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={handleBackToDashboard}
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>

        <div className="next-steps">
          <h3>What's Next?</h3>
          <ul>
            <li>Download your admit card</li>
            <li>Keep your payment receipt for reference</li>
            <li>Check your email for confirmation</li>
            <li>Prepare for your examination</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 