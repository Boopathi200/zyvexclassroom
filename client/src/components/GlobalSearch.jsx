import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiJson } from '../api.js';
import { GlassCard } from './ui/GlassCard.jsx';

export default function GlobalSearch({ open, onClose }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQ('');
      setRes(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setRes(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiJson(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
        setRes(data);
      } catch {
        setRes({ classrooms: [], assignments: [], videos: [] });
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-start justify-center pt-24 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
        <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close search" />
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-xl">
          <GlassCard className="overflow-hidden border border-white/15 shadow-2xl">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search classes, assignments, videos…"
              className="w-full border-b border-black/5 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 dark:text-white"
            />
            <div className="max-h-[50vh] overflow-y-auto p-3 text-sm space-y-4">
              {loading && <p className="text-xs text-zinc-500">Searching…</p>}
              {!loading && res && (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Classrooms</p>
                    {res.classrooms?.length === 0 && <p className="text-xs text-zinc-500">No matches</p>}
                    {res.classrooms?.map((c) => (
                      <Link
                        key={c._id}
                        to={`/dashboard/classrooms/${c._id}`}
                        onClick={onClose}
                        className="block rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <span className="text-zinc-900 dark:text-white">{c.name}</span>
                        <span className="ml-2 text-[10px] font-mono text-zyvex-gold">{c.code}</span>
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Assignments</p>
                    {res.assignments?.length === 0 && <p className="text-xs text-zinc-500">No matches</p>}
                    {res.assignments?.map((a) => (
                      <Link
                        key={a._id}
                        to={`/dashboard/classrooms/${a.classroom?._id}?tab=assignments`}
                        onClick={onClose}
                        className="block rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200"
                      >
                        {a.title}{' '}
                        <span className="text-[11px] text-zinc-500">· {a.classroom?.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Videos</p>
                    {res.videos?.length === 0 && <p className="text-xs text-zinc-500">No matches</p>}
                    {res.videos?.map((v) => (
                      <Link
                        key={v._id}
                        to={`/dashboard/classrooms/${v.classroom?._id}?tab=videos`}
                        onClick={onClose}
                        className="block rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200"
                      >
                        {v.title}{' '}
                        <span className="text-[11px] text-zyvex-gold">{v.subject}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>
    </motion.div>
  );
}
