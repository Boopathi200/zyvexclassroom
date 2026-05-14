import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiJson, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const loadMe = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const data = await apiJson('/api/auth/me');
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const data = await apiJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await apiJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = useCallback((partial) => {
    setUser((u) => {
      if (!u || !partial) return u;
      return {
        ...u,
        ...partial,
        preferences: {
          ...(u.preferences || { theme: 'dark' }),
          ...(partial.preferences || {}),
        },
      };
    });
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, loadMe, updateUser }),
    [user, ready, login, register, logout, loadMe, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
