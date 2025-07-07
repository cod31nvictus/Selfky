import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './TransactionsSection.css';

const TransactionsSection = () => {
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStatistics();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPayments();
      if (response.success) {
        setPayments(response.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await adminAPI.getPaymentStatistics();
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const closePaymentDetails = () => {
    setShowPaymentDetails(false);
    setSelectedPayment(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="transactions-section">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="transactions-section">
      <h2>Payment Transactions</h2>
      
      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      <div className="statistics-grid">
        <div className="stat-card">
          <h3>Total Payments</h3>
          <p className="stat-number">{statistics.totalPayments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Attempts</h3>
          <p className="stat-number">{statistics.totalAttempts || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Amount</h3>
          <p className="stat-number">{formatAmount(statistics.totalAmount || 0)}</p>
        </div>
        <div className="stat-card">
          <h3>Today's Payments</h3>
          <p className="stat-number">{statistics.todayPayments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <p className="stat-number">{statistics.thisMonthPayments || 0}</p>
        </div>
        {statistics.statusBreakdown && (
          <div className="stat-card">
            <h3>Status Breakdown</h3>
            <div className="status-breakdown">
              {Object.entries(statistics.statusBreakdown).map(([status, count]) => (
                <div key={status} className="status-item">
                  <span className={`status-badge ${status}`}>{status}</span>
                  <span className="status-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="payments-table-container">
        <h3>Recent Payments</h3>
        {payments.length === 0 ? (
          <p className="no-payments">No payments found</p>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Application No.</th>
                <th>Applicant Name</th>
                <th>Course</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{payment.applicationNumber || 'N/A'}</td>
                  <td>{payment.userName}</td>
                  <td>{payment.courseType || 'N/A'}</td>
                  <td>{payment.userEmail}</td>
                  <td>{formatAmount(payment.amount)}</td>
                  <td>
                    <span className={`status-badge ${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{formatDate(payment.date)}</td>
                  <td>
                    <button
                      className="view-details-btn"
                      onClick={() => handlePaymentClick(payment)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPayment && (
        <div className="modal-overlay" onClick={closePaymentDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Details</h3>
              <button className="close-btn" onClick={closePaymentDetails}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Payment ID:</strong>
                <span>{selectedPayment.id}</span>
              </div>
              <div className="detail-row">
                <strong>Razorpay Order ID:</strong>
                <span>{selectedPayment.razorpayOrderId || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Razorpay Payment ID:</strong>
                <span>{selectedPayment.razorpayPaymentId || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Application ID:</strong>
                <span>{selectedPayment.applicationId}</span>
              </div>
              <div className="detail-row">
                <strong>Application Number:</strong>
                <span>{selectedPayment.applicationNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Course Type:</strong>
                <span>{selectedPayment.courseType || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Applicant Name:</strong>
                <span>{selectedPayment.userName}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedPayment.userEmail}</span>
              </div>
              <div className="detail-row">
                <strong>Amount:</strong>
                <span>{formatAmount(selectedPayment.amount)}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${selectedPayment.status}`}>
                  {selectedPayment.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Receipt:</strong>
                <span>{selectedPayment.receipt || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Payment Date:</strong>
                <span>{formatDate(selectedPayment.date)}</span>
              </div>
              {selectedPayment.errorMessage && (
                <div className="detail-row">
                  <strong>Error Message:</strong>
                  <span className="error-message">{selectedPayment.errorMessage}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closePaymentDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsSection; 