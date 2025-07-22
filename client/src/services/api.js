const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to get admin token
const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper function to make admin API calls
const adminApiCall = async (endpoint, options = {}) => {
  const adminToken = getAdminToken();
  
  if (!adminToken) {
    throw new Error('Admin token not found. Please login again.');
  }
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken,
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('Admin API Call:', `${API_BASE_URL}${endpoint}`, { adminToken: adminToken.substring(0, 10) + '...' });
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      console.error('Admin API Error Response:', data);
      throw new Error(data.error || 'Admin API request failed');
    }

    return data;
  } catch (error) {
    console.error('Admin API Error:', error);
    throw error;
  }
};

// Application API functions
export const applicationAPI = {
  // Get all applications for current user
  getMyApplications: () => apiCall('/applications/my-applications'),

  // Get specific application
  getApplication: (id) => apiCall(`/applications/${id}`),
  
  // Get application by ID (for viewing)
  getApplicationById: (id) => apiCall(`/applications/${id}`),

  // Create new application
  createApplication: async (formData) => {
    const token = getAuthToken();
    
    const data = new FormData();
    data.append('courseType', formData.courseType);
    data.append('fullName', formData.fullName);
    data.append('fathersName', formData.fathersName);
    data.append('aadharNumber', formData.aadharNumber || '');
    data.append('dateOfBirth', formData.dateOfBirth);
    data.append('sex', formData.sex || '');
    data.append('nationality', formData.nationality || 'Indian');
    data.append('category', formData.category);
    data.append('correspondenceAddress', formData.correspondenceAddress || '');
    data.append('permanentAddress', formData.permanentAddress || '');
    data.append('correspondencePhone', formData.correspondencePhone || '');
    data.append('qualifyingExamRollNo', formData.qualifyingExamRollNo || '');
    data.append('qualifyingExamStatus', formData.qualifyingExamStatus || 'passed');
    data.append('qualifyingBoard', formData.qualifyingBoard || '');
    data.append('qualifyingYear', formData.qualifyingYear || '');
    data.append('qualifyingSubjects', formData.qualifyingSubjects || '');
    data.append('qualifyingMarksObtained', formData.qualifyingMarksObtained || '');
    data.append('qualifyingMaxMarks', formData.qualifyingMaxMarks || '');
    data.append('qualifyingPercentage', formData.qualifyingPercentage || '');
    data.append('highSchoolRollNo', formData.highSchoolRollNo || '');
    data.append('highSchoolBoard', formData.highSchoolBoard || '');
    data.append('highSchoolYear', formData.highSchoolYear || '');
    data.append('highSchoolSubjects', formData.highSchoolSubjects || '');
    data.append('highSchoolMarksObtained', formData.highSchoolMarksObtained || '');
    data.append('highSchoolMaxMarks', formData.highSchoolMaxMarks || '');
    data.append('highSchoolPercentage', formData.highSchoolPercentage || '');
    data.append('intermediateBoard', formData.intermediateBoard || '');
    data.append('intermediateYear', formData.intermediateYear || '');
    data.append('intermediateSubjects', JSON.stringify(formData.intermediateSubjects || {}));
    data.append('intermediateMarksObtained', formData.intermediateMarksObtained || '');
    data.append('intermediateMaxMarks', formData.intermediateMaxMarks || '');
    data.append('intermediatePercentage', formData.intermediatePercentage || '');
    // BPharm Year Details
    data.append('bpharmYear1MarksObtained', formData.bpharmYear1MarksObtained || '');
    data.append('bpharmYear1MaxMarks', formData.bpharmYear1MaxMarks || '');
    data.append('bpharmYear1Percentage', formData.bpharmYear1Percentage || '');
    data.append('bpharmYear2MarksObtained', formData.bpharmYear2MarksObtained || '');
    data.append('bpharmYear2MaxMarks', formData.bpharmYear2MaxMarks || '');
    data.append('bpharmYear2Percentage', formData.bpharmYear2Percentage || '');
    data.append('bpharmYear3MarksObtained', formData.bpharmYear3MarksObtained || '');
    data.append('bpharmYear3MaxMarks', formData.bpharmYear3MaxMarks || '');
    data.append('bpharmYear3Percentage', formData.bpharmYear3Percentage || '');
    data.append('bpharmYear4MarksObtained', formData.bpharmYear4MarksObtained || '');
    data.append('bpharmYear4MaxMarks', formData.bpharmYear4MaxMarks || '');
    data.append('bpharmYear4Percentage', formData.bpharmYear4Percentage || '');
    data.append('placeOfApplication', formData.placeOfApplication || '');
    data.append('photo', formData.photo);
    data.append('signature', formData.signature);
    
    // Add optional documents if they exist
    if (formData.categoryCertificate) {
      data.append('categoryCertificate', formData.categoryCertificate);
    }
    if (formData.highSchoolCertificate) {
      data.append('highSchoolCertificate', formData.highSchoolCertificate);
    }
    if (formData.intermediateCertificate) {
      data.append('intermediateCertificate', formData.intermediateCertificate);
    }
    // BPharm Year Marksheets
    if (formData.bpharmYear1Marksheet) {
      data.append('bpharmYear1Marksheet', formData.bpharmYear1Marksheet);
    }
    if (formData.bpharmYear2Marksheet) {
      data.append('bpharmYear2Marksheet', formData.bpharmYear2Marksheet);
    }
    if (formData.bpharmYear3Marksheet) {
      data.append('bpharmYear3Marksheet', formData.bpharmYear3Marksheet);
    }
    if (formData.bpharmYear4Marksheet) {
      data.append('bpharmYear4Marksheet', formData.bpharmYear4Marksheet);
    }

    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create application');
    }

    return result;
  },

  // Update payment status
  updatePaymentStatus: (applicationId, paymentData) => 
    apiCall(`/applications/${applicationId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    }),

  // Generate admit card
  generateAdmitCard: (applicationId) => 
    apiCall(`/applications/${applicationId}/admit-card`, {
      method: 'POST',
    }),

  // Download admit card PDF
  downloadAdmitCardPDF: (applicationId) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/applications/${applicationId}/admit-card-pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
};

// Auth API functions
export const authAPI = {
  login: (credentials) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  forgotPassword: (email) => 
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, newPassword) => 
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  verifyResetToken: (token) => 
    apiCall('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
};

// Admin API functions
export const adminAPI = {
  // Get all applications with pagination
  getApplications: (page = 1, limit = 20, status = '', courseType = '', category = '') => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);
    if (courseType) params.append('courseType', courseType);
    if (category) params.append('category', category);
    return adminApiCall(`/admin/applications?${params.toString()}`);
  },

  // Get all applicants (users) with pagination
  getApplicants: (page = 1, limit = 20, search = '') => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    return adminApiCall(`/admin/applicants?${params.toString()}`);
  },

  // Update application status
  updateApplicationStatus: (applicationId, status) => 
    adminApiCall(`/admin/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Reset user password
  resetUserPassword: (userId, newPassword, confirmPassword) => 
    adminApiCall(`/admin/applicants/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, confirmPassword }),
    }),

  // Get specific application for admin
  getApplication: (applicationId) => adminApiCall(`/admin/applications/${applicationId}`),

  // Get admit card for application (admin)
  getAdmitCard: (applicationId) => adminApiCall(`/admin/admit-card/${applicationId}`),

  // Create application for user (admin)
  createApplicationForUser: (userId, formData) => {
    const adminToken = getAdminToken();
    
    const data = new FormData();
    data.append('userId', userId);
    data.append('courseType', formData.get('courseType'));
    data.append('fullName', formData.get('fullName'));
    data.append('fathersName', formData.get('fathersName'));
    data.append('category', formData.get('category'));
    data.append('dateOfBirth', formData.get('dateOfBirth'));
    if (formData.get('photo')) data.append('photo', formData.get('photo'));
    if (formData.get('signature')) data.append('signature', formData.get('signature'));
    if (formData.get('categoryCertificate')) data.append('categoryCertificate', formData.get('categoryCertificate'));
    if (formData.get('highSchoolCertificate')) data.append('highSchoolCertificate', formData.get('highSchoolCertificate'));
    if (formData.get('intermediateCertificate')) data.append('intermediateCertificate', formData.get('intermediateCertificate'));

    return fetch(`${API_BASE_URL}/admin/applications`, {
      method: 'POST',
      headers: {
        'x-admin-token': adminToken,
      },
      body: data,
    }).then(response => response.json());
  },

  // Update application (admin)
  updateApplication: (applicationId, formData) => {
    const adminToken = getAdminToken();
    
    const data = new FormData();
    data.append('courseType', formData.get('courseType'));
    data.append('fullName', formData.get('fullName'));
    data.append('fathersName', formData.get('fathersName'));
    data.append('category', formData.get('category'));
    data.append('dateOfBirth', formData.get('dateOfBirth'));
    if (formData.get('photo')) data.append('photo', formData.get('photo'));
    if (formData.get('signature')) data.append('signature', formData.get('signature'));
    if (formData.get('categoryCertificate')) data.append('categoryCertificate', formData.get('categoryCertificate'));
    if (formData.get('highSchoolCertificate')) data.append('highSchoolCertificate', formData.get('highSchoolCertificate'));
    if (formData.get('intermediateCertificate')) data.append('intermediateCertificate', formData.get('intermediateCertificate'));

    return fetch(`${API_BASE_URL}/admin/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'x-admin-token': adminToken,
      },
      body: data,
    }).then(response => response.json());
  },

  // Payment-related functions with pagination
  getPayments: (page = 1, limit = 20, status = '', search = '') => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return adminApiCall(`/payment/admin/payments?${params.toString()}`);
  },

  // Log failed payment attempt
  logFailedPaymentAttempt: (applicationId, userId, orderId, amount, error, receipt) => {
    return apiCall('/payment/log-failed-attempt', {
      method: 'POST',
      body: JSON.stringify({
        applicationId,
        userId,
        orderId,
        amount,
        error,
        receipt
      })
    });
  },
  
  getPaymentStatistics: () => adminApiCall('/payment/admin/statistics'),

  // Analytics
  getAnalytics: () => adminApiCall('/admin/analytics'),

  // Monitoring dashboard
  getMonitoringDashboard: () => adminApiCall('/monitoring/dashboard'),

  // Download invigilator sheet PDF
  downloadInvigilatorSheet: () => {
    const adminToken = getAdminToken();
    return fetch(`${API_BASE_URL}/admin/invigilator-sheet-pdf`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken
      }
    });
  },

  // Export applications to CSV
  exportApplicationsCSV: (courseType = '', status = '') => {
    const adminToken = getAdminToken();
    const params = new URLSearchParams();
    if (courseType) params.append('courseType', courseType);
    if (status) params.append('status', status);
    
    return fetch(`${API_BASE_URL}/admin/export-applications-csv?${params.toString()}`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken
      }
    });
  },

  // Export applicants to CSV
  exportApplicantsCSV: (search = '') => {
    const adminToken = getAdminToken();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    return fetch(`${API_BASE_URL}/admin/export-applicants-csv?${params.toString()}`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken
      }
    });
  },

  // Export transactions to CSV
  exportTransactionsCSV: (status = '', search = '') => {
    const adminToken = getAdminToken();
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    return fetch(`${API_BASE_URL}/admin/export-transactions-csv?${params.toString()}`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken
      }
    });
  },
};

// Utility functions
export const uploadFile = async (file) => {
  // This would be used if you want to upload files separately
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  return response.json();
};

export default {
  applicationAPI,
  authAPI,
  adminAPI,
  uploadFile,
}; 