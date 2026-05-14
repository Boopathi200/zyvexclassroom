import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { apiJson } from '../api.js';
import GlobalSearch from './GlobalSearch.jsx';
import ChatAssistant from './ChatAssistant.jsx';

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-zyvex-gold/15 text-zyvex-gold border border-zyvex-gold/30 dark:text-zyvex-goldlight'
      : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
  }`;

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await apiJson('/api/notifications');
        if (!cancelled) setUnread(list.filter((n) => !n.read).length);
      } catch {
        if (!cancelled) setUnread(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen flex bg-stone-100 text-zinc-900 dark:bg-zyvex-black dark:text-zinc-100">
      <aside className="hidden md:flex w-72 flex-col border-r border-black/5 bg-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zyvex-charcoal/80">
        <div className="p-6 border-b border-black/5 dark:border-white/10">
          <Link to="/dashboard" className="font-display text-xl font-semibold tracking-tight">
            <span className="text-gradient-gold">Zyvex</span>
            <span className="text-zinc-900 dark:text-white"> Classroom</span>
          </Link>
          <p className="mt-2 text-xs text-zinc-500 capitalize">{user?.role} workspace</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex-1 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-left text-xs text-zinc-500 shadow-sm dark:border-white/10 dark:bg-black/30"
            >
              Search… <kbd className="float-right text-[10px] opacity-60">⌘K</kbd>
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/dashboard" end className={navClass}>
            Overview
          </NavLink>
          <NavLink to="/dashboard/schedule" className={navClass}>
            Schedule
          </NavLink>
          {user?.role === 'student' && (
            <NavLink to="/dashboard/analytics" className={navClass}>
              Analytics
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/dashboard/admin" className={navClass}>
              Admin
            </NavLink>
          )}
          <NavLink to="/dashboard/notifications" className={navClass}>
            Notifications
            {unread > 0 && (
              <span className="ml-auto rounded-full bg-zyvex-gold px-2 py-0.5 text-[10px] font-bold text-black">
                {unread}
              </span>
            )}
          </NavLink>
          <NavLink to="/dashboard/settings" className={navClass}>
            Profile
          </NavLink>
        </nav>
        <div className="p-4 border-t border-black/5 dark:border-white/10 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex-1 rounded-xl border border-black/10 py-2 text-xs font-medium text-zinc-600 hover:border-zyvex-gold/40 dark:border-white/10 dark:text-zinc-300"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-black/40">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            <button
              type="button"
              onClick={() => {
                logout();
                nav('/login');
              }}
              className="mt-3 w-full rounded-xl border border-black/10 py-2 text-xs font-medium text-zinc-600 hover:border-zyvex-gold/40 dark:border-white/15 dark:text-zinc-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-white/80 backdrop-blur-xl px-4 py-3 dark:border-white/10 dark:bg-zyvex-charcoal/95">
          <Link to="/dashboard" className="font-display font-semibold text-gradient-gold">
            Zyvex
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="rounded-lg border border-black/10 px-2 py-1 text-[11px] text-zinc-600 dark:border-white/10 dark:text-zinc-300"
            >
              Search
            </button>
            <Link
              to="/dashboard/notifications"
              className="relative rounded-lg border border-black/10 px-3 py-1.5 text-xs text-zinc-700 dark:border-white/10 dark:text-zinc-300"
            >
              Alerts
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] rounded-full bg-zyvex-gold px-1 text-[10px] font-bold text-black text-center">
                  {unread}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-[11px] text-zinc-500"
            >
              Theme
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                nav('/login');
              }}
              className="text-xs text-zinc-500"
            >
              Out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ChatAssistant />

      <KeyboardSearch openSetter={setSearchOpen} />
    </div>
  );
}

function KeyboardSearch({ openSetter }) {
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSetter(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSetter]);
  return null;
}
