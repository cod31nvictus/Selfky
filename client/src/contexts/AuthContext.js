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
  const [heartbeatInterval, setHeartbeatInterval] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      authAPI.getProfile()
        .then(response => {
          setUser(response.user);
          startHeartbeat();
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const startHeartbeat = () => {
    // Send heartbeat every 5 minutes to keep session alive
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        authAPI.heartbeat()
          .catch(error => {
            console.error('Heartbeat failed:', error);
            // If heartbeat fails, user might be logged out
            logout();
          });
      }
    }, 5 * 60 * 1000); // 5 minutes

    setHeartbeatInterval(interval);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      setHeartbeatInterval(null);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      console.log('AuthContext: Setting token and user');
      localStorage.setItem('token', response.token);
      setUser(response.user);
      startHeartbeat();
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Send logout request to server
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      localStorage.removeItem('token');
      setUser(null);
      stopHeartbeat();
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 