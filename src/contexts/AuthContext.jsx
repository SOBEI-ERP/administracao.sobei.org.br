'use client';

// ============================================
// SOBEI Portal — Auth Context (Mock)
// ============================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginAdmin as loginApi } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restaura a sessão ao montar o componente
  useEffect(() => {
    const token = localStorage.getItem('sobei_token');
    const storedUser = localStorage.getItem('sobei_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('sobei_token');
        localStorage.removeItem('sobei_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const result = await loginApi(credentials);
      if (result.success) {
        localStorage.setItem('sobei_user', JSON.stringify(result.user));
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch {
      return { success: false, message: 'Erro ao realizar login' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sobei_token');
    localStorage.removeItem('sobei_user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

