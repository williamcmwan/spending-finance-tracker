import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../integrations/api/client';

interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  error: string | null;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await apiClient.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiClient.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await apiClient.login({ email, password });
      setUser(response.user);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const response = await apiClient.register({ email, password, name });
      setUser(response.user);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    }
  };

  const loginWithGoogle = () => {
    setError(null);
    // Redirect to Google OAuth endpoint
    const apiBaseUrl = window.location.href.includes('finance.shopassist.dpdns.org') 
      ? 'https://api.finance.shopassist.dpdns.org/api' 
      : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
    const googleAuthUrl = `${apiBaseUrl}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};