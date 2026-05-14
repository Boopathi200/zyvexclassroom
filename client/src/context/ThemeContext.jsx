import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { apiJson } from '../api.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, ready, updateUser } = useAuth();
  const [theme, setThemeState] = useState(() => (localStorage.getItem('zyvex_theme') === 'light' ? 'light' : 'dark'));

  useEffect(() => {
    if (!ready) return;
    if (user?.preferences?.theme === 'light' || user?.preferences?.theme === 'dark') {
      setThemeState(user.preferences.theme);
    }
  }, [user, ready]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('zyvex_theme', theme);
  }, [theme]);

  const setTheme = useCallback(
    async (next) => {
      const t = next === 'light' ? 'light' : 'dark';
      setThemeState(t);
      if (user) {
        try {
          const data = await apiJson('/api/users/me', {
            method: 'PATCH',
            body: JSON.stringify({ preferences: { theme: t } }),
          });
          if (data.user) updateUser(data.user);
        } catch {
          /* keep local theme */
        }
      }
    },
    [user, updateUser]
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
