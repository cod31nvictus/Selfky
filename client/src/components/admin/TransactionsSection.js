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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStatistics();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPayments(currentPage, pageSize, statusFilter, searchTerm);
      if (response.success) {
        setPayments(response.payments);
        setTotalPages(response.pagination?.pages || 1);
        setTotalRecords(response.pagination?.total || 0);
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await adminAPI.exportTransactionsCSV(statusFilter, searchTerm);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export CSV. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please try again.');
    } finally {
      setExporting(false);
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

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
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
      <div className="header-section">
        <h2>Payment Transactions</h2>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="export-btn"
        >
          {exporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </>
          )}
        </button>
      </div>
      
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
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by application number, name, or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="status-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        <p>Showing {payments.length} of {totalRecords} transactions</p>
      </div>

      {/* Transactions Table */}
      <div className="transactions-table">
        {payments.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Application</th>
                <th>Applicant</th>
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
                  <td>
                    <div>
                      <div className="application-number">{payment.applicationNumber}</div>
                      <div className="course-type">{payment.courseType}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="applicant-name">{payment.userName}</div>
                      <div className="applicant-email">{payment.userEmail}</div>
                    </div>
                  </td>
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
        ) : (
          <div className="no-transactions">
            <p>No transactions found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && renderPagination()}

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
              {selectedPayment.attemptType && (
                <div className="detail-row">
                  <strong>Attempt Type:</strong>
                  <span>{selectedPayment.attemptType}</span>
                </div>
              )}
              {selectedPayment.failureType && (
                <div className="detail-row">
                  <strong>Failure Type:</strong>
                  <span>{selectedPayment.failureType}</span>
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