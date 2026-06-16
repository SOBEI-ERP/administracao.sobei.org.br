'use client';

// ============================================
// SOBEI Portal — Auth Context
// ============================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginAdmin as loginApi, logoutAdmin as logoutApi, fetchMe } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restaura a sessão ao montar o componente (valida cookie via /me)
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const me = await fetchMe();
        if (!cancelled) {
          if (me) {
            setUser(me);
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('sobei_user');
          }
        }
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem('sobei_user');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    restore();
    return () => { cancelled = true; };
  }, []);

  // Limpa resíduos de sessão ao fechar a aba
  useEffect(() => {
    const tabId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem('sobei_tab_id', tabId);

    function handleBeforeUnload() {
      sessionStorage.removeItem('sobei_user');
      sessionStorage.removeItem('sobei_tab_id');
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const result = await loginApi(credentials);
      if (result.success) {
        sessionStorage.setItem('sobei_user', JSON.stringify(result.user));
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

  const logout = useCallback(async () => {
    await logoutApi();
    sessionStorage.removeItem('sobei_user');
    sessionStorage.removeItem('sobei_tab_id');
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
