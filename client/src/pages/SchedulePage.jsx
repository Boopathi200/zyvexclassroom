import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiJson } from '../api.js';
import { GlassCard } from '../components/ui/GlassCard.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';

function groupByDay(sessions) {
  const map = new Map();
  sessions.forEach((s) => {
    const d = new Date(s.scheduledAt);
    const key = d.toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  });
  return [...map.entries()];
}

export default function SchedulePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiJson('/api/live-sessions/schedule');
        setSessions(data);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => groupByDay(sessions), [sessions]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Schedule & live classes</h1>
        <p className="text-sm text-zinc-500 mt-1">Upcoming sessions across your classrooms.</p>
      </div>

      {loading && <CardSkeleton />}

      {!loading && grouped.length === 0 && <p className="text-sm text-zinc-500">No upcoming sessions in the next few weeks.</p>}

      <div className="space-y-6">
        {grouped.map(([day, items]) => (
          <div key={day}>
            <p className="text-xs uppercase tracking-[0.2em] text-zyvex-gold mb-3">{day}</p>
            <div className="space-y-3">
              {items.map((s) => (
                <motion.div key={s._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{s.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {s.classroom?.name} · {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          s.status === 'live'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : s.status === 'ended'
                              ? 'bg-zinc-500/20 text-zinc-400'
                              : 'bg-zyvex-gold/15 text-zyvex-gold'
                        }`}
                      >
                        {s.status}
                      </span>
                      <Link
                        to={`/dashboard/classrooms/${s.classroom?._id}?tab=live`}
                        className="rounded-lg border border-zyvex-gold/40 px-3 py-1.5 text-xs text-zyvex-gold dark:text-zyvex-goldlight hover:bg-zyvex-gold/10"
                      >
                        Open class
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
