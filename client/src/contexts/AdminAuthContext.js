import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuthStatus();
  }, []);

  const checkAdminAuthStatus = () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setLoading(false);
        return;
      }
      
      // For now, just check if token exists
      // In a more secure implementation, you'd verify the token with the server
      setIsAdminLoggedIn(true);
      setAdminUser({ email: 'admin@selfky.com' }); // Placeholder
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('adminToken');
      setIsAdminLoggedIn(false);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const response = await adminAPI.login({ email, password });
      
      if (response.success && response.adminToken) {
        localStorage.setItem('adminToken', response.adminToken);
        setIsAdminLoggedIn(true);
        setAdminUser(response.admin);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, adminUser, loading, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 