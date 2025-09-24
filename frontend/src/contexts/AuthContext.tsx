import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'super_admin' | 'tagger';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error: any) {
      setUser(null);
      setIsAuthenticated(false);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const logout = async () => {
    // Stop token refresh interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors during logout
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Silent auth check for token refresh (without loading state)
  const refreshAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      // Token expired or invalid - logout user
      console.log('Token refresh failed, logging out user');
      setUser(null);
      setIsAuthenticated(false);
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      return false;
    }
  };

  // Start token refresh interval
  const startTokenRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Check auth every 5 minutes (300000ms)
    const interval = setInterval(async () => {
      if (isAuthenticated) {
        console.log('Refreshing authentication token...');
        await refreshAuth();
      }
    }, 300000); // 5 minutes

    setRefreshInterval(interval);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Start token refresh when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !refreshInterval) {
      startTokenRefresh();
    }
  }, [isAuthenticated]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};