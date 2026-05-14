import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { apiJson } from '../api.js';
import { GlassCard } from '../components/ui/GlassCard.jsx';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const data = await apiJson('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      if (data.user) updateUser(data.user);
      setMsg('Saved.');
    } catch (er) {
      setMsg(er.message);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Profile & preferences</h1>
        <p className="text-sm text-zinc-500 mt-1">Luxury light/dark theme and your display name.</p>
      </div>
      <GlassCard className="p-6 space-y-4">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500">Display name</label>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button type="submit" className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-black">
            Save profile
          </button>
        </form>
        <div className="border-t border-black/5 pt-4 dark:border-white/10">
          <p className="text-xs font-medium text-zinc-500 mb-2">Appearance</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium ${
                theme === 'dark' ? 'border-zyvex-gold bg-zyvex-gold/10 text-zyvex-goldlight' : 'border-black/10 dark:border-white/10'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium ${
                theme === 'light' ? 'border-zyvex-gold bg-zyvex-gold/10 text-zyvex-gold' : 'border-black/10 dark:border-white/10'
              }`}
            >
              Light
            </button>
          </div>
        </div>
        {msg && <p className="text-xs text-zyvex-gold">{msg}</p>}
      </GlassCard>
    </div>
  );
}
