import React, { createContext, useContext, useState } from 'react';
import { User } from '@/domain/entities/User';
import { ApiAuthRepository } from '@/infrastructure/repositories/ApiAuthRepository';
import { AuthUseCases } from '@/domain/usecases/auth/AuthUseCases';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const authUseCases = new AuthUseCases(new ApiAuthRepository());

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password = 'changeme'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const authToken = await authUseCases.login({ email, password });
      setToken(authToken.access_token);

      const userProfile = await authUseCases.getProfile(authToken.access_token);
      setUser(userProfile);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error en inicio de sesión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, logout }}>
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
