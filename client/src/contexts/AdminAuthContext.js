// Do not commit real credentials. Use .env files and .gitignore.

import React, { createContext, useState, useEffect } from 'react';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin credentials - must be configured via environment variables
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

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
      setIsAdminLoggedIn(true);
      setAdminUser({ email: ADMIN_EMAIL });
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('adminToken');
      setIsAdminLoggedIn(false);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = (email, password) => {
    // Only allow login with environment-based credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminToken = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('adminToken', adminToken);
      setIsAdminLoggedIn(true);
      setAdminUser({ email });
      return { success: true };
    } else {
      return { success: false, error: 'Invalid credentials' };
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

// Custom hook to use admin auth context
export const useAdminAuth = () => {
  const context = React.useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}; 