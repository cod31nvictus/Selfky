import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMasterAccess, setIsMasterAccess] = useState(false);
  const [masterUser, setMasterUser] = useState(null);

  // Check if user is authenticated on app startup
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const accessType = localStorage.getItem('accessType');
      const masterUserData = localStorage.getItem('masterUser');

      if (!token) {
        setLoading(false);
        return;
      }

      // Check if this is a master access session
      if (accessType === 'master' && masterUserData) {
        const parsedMasterUser = JSON.parse(masterUserData);
        setIsMasterAccess(true);
        setMasterUser(parsedMasterUser);
        setIsAuthenticated(true);
        setUser({ token, ...parsedMasterUser });
        setLoading(false);
        return;
      }

      // Regular user authentication
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/profile-with-application`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser({ token, ...data.user });
        setIsMasterAccess(false);
        setMasterUser(null);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('accessType');
        localStorage.removeItem('masterUser');
        setIsAuthenticated(false);
        setUser(null);
        setIsMasterAccess(false);
        setMasterUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('accessType');
      localStorage.removeItem('masterUser');
      setIsAuthenticated(false);
      setUser(null);
      setIsMasterAccess(false);
      setMasterUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      setUser({ token, ...user });
      setIsAuthenticated(true);
      setIsMasterAccess(false);
      setMasterUser(null);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessType');
    localStorage.removeItem('masterUser');
    setUser(null);
    setIsAuthenticated(false);
    setIsMasterAccess(false);
    setMasterUser(null);
  };

  const exitMasterAccess = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessType');
    localStorage.removeItem('masterUser');
    setUser(null);
    setIsAuthenticated(false);
    setIsMasterAccess(false);
    setMasterUser(null);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    isMasterAccess,
    masterUser,
    login,
    register,
    logout,
    exitMasterAccess,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 