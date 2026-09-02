import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('psl_user');
    const savedToken = localStorage.getItem('psl_token');

    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser) as AuthUser;
        setUser(parsed);
      } catch {
        localStorage.removeItem('psl_user');
        localStorage.removeItem('psl_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const authData = await api.login(username, password);
    setUser(authData);
    localStorage.setItem('psl_token', authData.token);
    localStorage.setItem('psl_user', JSON.stringify(authData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('psl_token');
    localStorage.removeItem('psl_user');
  };

  const isAdmin = user?.roles?.includes('Admin') ?? false;
  const isViewer = user?.roles?.includes('Viewer') ?? false;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isViewer,
        isAuthenticated,
        login,
        logout,
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
