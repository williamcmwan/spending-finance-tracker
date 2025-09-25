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
  login: (email: string, password: string) => Promise<{ requires2fa?: boolean } | void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  verifyTotp: (code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
  const [tempToken, setTempToken] = useState<string | null>(null);

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

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.user);
    } catch (e) {
      // ignore, handled by ProtectedRoute elsewhere
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await apiClient.login({ email, password });
      console.log('Login response:', response);
      if (response.requires2fa && response.tempToken) {
        setTempToken(response.tempToken);
        return { requires2fa: true };
      }
      // If no 2FA required, set user and return success
      if (response.user) {
        console.log('Setting user:', response.user);
        setUser(response.user);
        setLoading(false); // Ensure loading is false after successful login
      }
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
      setLoading(false); // Ensure loading is false after successful registration
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    }
  };

  const verifyTotp = async (code: string) => {
    if (!tempToken) throw new Error('No 2FA session');
    try {
      const response = await apiClient.verifyTotp(tempToken, code);
      setUser(response.user);
      setTempToken(null);
      setLoading(false); // Ensure loading is false after successful 2FA verification
    } catch (error: any) {
      setError(error.message || '2FA verification failed');
      throw error;
    }
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
    verifyTotp,
    logout,
    refreshUser,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};