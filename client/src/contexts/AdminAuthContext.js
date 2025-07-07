import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Hardcoded admin credentials
  const ADMIN_EMAIL = 'cod31nvictus@gmail.com';
  const ADMIN_PASSWORD = 'Bhoo@321';

  // Check admin auth status on app load
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

      // For now, we'll just check if the token exists
      // In a real app, you'd validate the token with the server
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

  const value = {
    isAdminLoggedIn,
    adminUser,
    loading,
    adminLogin,
    adminLogout,
    checkAdminAuthStatus
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 