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
      'X-Admin-Token': adminToken,
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
    data.append('category', formData.category);
    data.append('dateOfBirth', formData.dateOfBirth);
    data.append('photo', formData.photo);
    data.append('signature', formData.signature);

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
  // Get all applications
  getApplications: () => adminApiCall('/admin/applications'),

  // Get all applicants (users)
  getApplicants: () => adminApiCall('/admin/applicants'),

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

    return fetch(`${API_BASE_URL}/admin/applications`, {
      method: 'POST',
      headers: {
        'X-Admin-Token': adminToken,
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

    return fetch(`${API_BASE_URL}/admin/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'X-Admin-Token': adminToken,
      },
      body: data,
    }).then(response => response.json());
  },

  // Payment-related functions
  getPayments: () => adminApiCall('/payment/admin/payments'),
  
  getPaymentStatistics: () => adminApiCall('/payment/admin/statistics'),

  // Analytics
  getAnalytics: () => adminApiCall('/admin/analytics'),

  // Download invigilator sheet PDF
  downloadInvigilatorSheet: () => {
    const adminToken = getAdminToken();
    return fetch(`${API_BASE_URL}/admin/invigilator-sheet-pdf`, {
      method: 'GET',
      headers: {
        'X-Admin-Token': adminToken
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