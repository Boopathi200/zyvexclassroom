import { useEffect, useState } from 'react';
import { apiJson } from '../api.js';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const list = await apiJson('/api/notifications');
    setItems(list);
  };

  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  const markRead = async (id) => {
    await apiJson(`/api/notifications/${id}/read`, { method: 'PATCH', body: '{}' });
    await load();
  };

  const markAll = async () => {
    await apiJson('/api/notifications/read-all', { method: 'PATCH', body: '{}' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Notifications</h1>
          <p className="text-zinc-500 text-sm mt-1">Stay on top of class activity.</p>
        </div>
        <button
          type="button"
          onClick={markAll}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-zyvex-gold/40 transition"
        >
          Mark all read
        </button>
      </div>

      <ul className="space-y-3">
        {items.length === 0 && <li className="text-zinc-500 text-sm">No notifications yet.</li>}
        {items.map((n) => (
          <li
            key={n._id}
            className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 ${
              n.read ? 'border-white/5 bg-white/[0.02]' : 'border-zyvex-gold/25 bg-zyvex-gold/5'
            }`}
          >
            <div className="flex-1">
              <p className="font-medium text-white">{n.title}</p>
              {n.message && <p className="text-sm text-zinc-400 mt-0.5">{n.message}</p>}
              <p className="text-[10px] text-zinc-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => markRead(n._id)}
                className="text-xs text-zyvex-gold hover:text-zyvex-goldlight shrink-0"
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
