import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types';
import { authService } from '../services/authService';

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType extends AuthState {
  login: (creds: LoginCredentials) => Promise<AuthResult>;
  register: (creds: RegisterCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const user = await authService.getSession();
        if (isMounted) {
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: !!user,
            isLoading: false,
          }));
        }
      } catch (error) {
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async (creds: LoginCredentials): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.login(creds);
      if (response.success && response.data) {
        setState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return { success: true };
      } else {
        const msg = response.message || 'Falha ao realizar login.';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: msg
        }));
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = 'Erro inesperado de conexão.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: msg
      }));
      return { success: false, message: msg };
    }
  }, []);

  const register = useCallback(async (creds: RegisterCredentials): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.register(creds);
      if (response.success && response.data) {
        setState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return { success: true };
      } else {
        const msg = response.message || 'Falha ao registrar.';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: msg
        }));
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = 'Erro inesperado ao registrar.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: msg
      }));
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};