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

  // Hardcoded admin credentials
  const ADMIN_EMAIL = 'cod31nvictus@gmail.com';
  const ADMIN_PASSWORD = 'Bhoo@321';

  useEffect(() => {
    // Check if admin is logged in on app load
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAdminLoggedIn(true);
      setAdminUser({ email: ADMIN_EMAIL });
    }
  }, []);

  const adminLogin = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminToken = 'admin_' + Date.now(); // Simple token generation
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
    adminLogin,
    adminLogout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 