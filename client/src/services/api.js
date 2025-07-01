const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
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

// Application API functions
export const applicationAPI = {
  // Get all applications for current user
  getMyApplications: () => apiCall('/applications/my-applications'),

  // Get specific application
  getApplication: (id) => apiCall(`/applications/${id}`),

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
  uploadFile,
}; 