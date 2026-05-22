'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize Auth State from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          setToken(savedToken);
          try {
            const data = await api.get('/auth/me');
            if (data.success && data.user) {
              setUser(data.user);
            } else {
              // Token invalid/expired
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
            }
          } catch (err) {
            console.error('[Auth Init Error] Failed to fetch current profile:', err.message);
            // Don't clear token on network failure, only on explicit 401
            if (err.statusCode === 401) {
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
            }
          }
        }
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', { name, email, password });
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const data = await api.get('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('[Auth Refresh Error]:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
