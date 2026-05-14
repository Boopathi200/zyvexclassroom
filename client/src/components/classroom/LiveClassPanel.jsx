import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiJson } from '../../api.js';
import { getSocket } from '../../lib/socket.js';
import { GlassCard } from '../ui/GlassCard.jsx';

const JITSI = 'https://meet.jit.si';

export default function LiveClassPanel({ classroomId, teacherControls, isStudent, sessions, onRefresh }) {
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [activeMeet, setActiveMeet] = useState(null);

  const live = useMemo(() => sessions.find((s) => s.status === 'live'), [sessions]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join-classroom', classroomId);
    const handler = () => {
      onRefresh?.();
    };
    socket.on('live:session', handler);
    return () => {
      socket.emit('leave-classroom', classroomId);
      socket.off('live:session', handler);
    };
  }, [classroomId, onRefresh]);

  const schedule = async (e) => {
    e.preventDefault();
    if (!scheduledAt) return;
    await apiJson('/api/live-sessions', {
      method: 'POST',
      body: JSON.stringify({ classroomId, title, scheduledAt }),
    });
    setTitle('');
    setScheduledAt('');
    await onRefresh();
  };

  const start = async (id) => {
    await apiJson(`/api/live-sessions/${id}/start`, { method: 'PATCH', body: '{}' });
    await onRefresh();
  };

  const end = async (id) => {
    await apiJson(`/api/live-sessions/${id}/end`, { method: 'PATCH', body: '{}' });
    await onRefresh();
  };

  const meetUrl = useCallback((roomId) => `${JITSI}/${encodeURIComponent(roomId)}`, []);

  return (
    <div className="space-y-6">
      {teacherControls && (
        <GlassCard className="p-5">
          <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">Schedule live session</h3>
          <form onSubmit={schedule} className="mt-4 grid md:grid-cols-3 gap-3">
            <input
              className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
              placeholder="Session title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
            <button
              type="submit"
              className="rounded-xl bg-zyvex-gold px-4 py-2 text-sm font-semibold text-black hover:bg-zyvex-goldlight"
            >
              Save to calendar
            </button>
          </form>
        </GlassCard>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {sessions.map((s) => (
          <GlassCard key={s._id} className="p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">{s.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{new Date(s.scheduledAt).toLocaleString()}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  s.status === 'live'
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : s.status === 'ended'
                      ? 'bg-zinc-500/20 text-zinc-400'
                      : 'bg-zyvex-gold/20 text-zyvex-gold'
                }`}
              >
                {s.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono break-all">Room: {s.meetRoomId}</p>
            <div className="flex flex-wrap gap-2 mt-auto">
              {(isStudent || teacherControls) && s.status !== 'ended' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveMeet(s)}
                    className="rounded-lg border border-zyvex-gold/40 px-3 py-1.5 text-xs font-medium text-zyvex-gold dark:text-zyvex-goldlight hover:bg-zyvex-gold/10"
                  >
                    Open meeting UI
                  </button>
                  <a
                    href={meetUrl(s.meetRoomId)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300"
                  >
                    New tab
                  </a>
                </>
              )}
              {teacherControls && s.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={() => start(s._id)}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black dark:bg-zinc-100"
                >
                  Start live
                </button>
              )}
              {teacherControls && s.status === 'live' && (
                <button type="button" onClick={() => end(s._id)} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-300 ring-1 ring-red-500/30">
                  End session
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {live && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          A session is live in this class right now.
        </div>
      )}

      <AnimatePresence>
        {activeMeet && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveMeet(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-white">{activeMeet.title}</p>
                <button type="button" className="text-xs text-zinc-400 hover:text-white" onClick={() => setActiveMeet(null)}>
                  Close
                </button>
              </div>
              <div className="aspect-video bg-black">
                <iframe title="Live class" className="h-full w-full" src={meetUrl(activeMeet.meetRoomId)} allow="camera; microphone; fullscreen; display-capture" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
