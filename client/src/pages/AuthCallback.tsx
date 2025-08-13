import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Set the token in the API client
      apiClient.setToken(token);
      
      // Redirect to dashboard after successful authentication
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setError('Authentication failed. No token received.');
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Authenticating...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Completing authentication...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
