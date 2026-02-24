// context/AuthContext.tsx - sudah benar
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api';
import { UserInfo } from '@/services/api';

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  getUserRole: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentToken = apiService.auth.getAccessToken();
      setToken(currentToken);
      
      if (apiService.auth.isAuthenticated()) {
        const result = await apiService.auth.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
          localStorage.setItem('user_role', result.data.role);
        } else {
          await apiService.auth.logout();
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    const result = await apiService.auth.login(username, password);
    
    if (result.success && result.data) {
      const userData = {
        id: result.data.user_id,
        username: result.data.username,
        name: result.data.name,
        role: result.data.role,
      };
      setUser(userData);
      const newToken = apiService.auth.getAccessToken();
      setToken(newToken);
      localStorage.setItem('user_role', result.data.role);
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await apiService.auth.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('user_role');
    setIsLoading(false);
  };

  const refreshUser = async () => {
    const currentToken = apiService.auth.getAccessToken();
    setToken(currentToken);
    
    if (apiService.auth.isAuthenticated()) {
      const result = await apiService.auth.getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
        localStorage.setItem('user_role', result.data.role);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user_role');
      }
    }
  };

  const isAdmin = () => {
    const role = user?.role || localStorage.getItem('user_role');
    return role === 'admin' || role === 'super_admin';
  };

  const hasRole = (role: string) => {
    const currentRole = user?.role || localStorage.getItem('user_role');
    return currentRole === role;
  };

  const getUserRole = () => {
    return user?.role || localStorage.getItem('user_role');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      token,
      login, 
      logout, 
      refreshUser,
      isAdmin,
      hasRole,
      getUserRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}