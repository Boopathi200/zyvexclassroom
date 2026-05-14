import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { apiJson } from '../api.js';
import { GlassCard } from '../components/ui/GlassCard.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const d = await apiJson('/api/analytics/student');
        setData(d);
      } catch (e) {
        setErr(e.message || 'Unable to load analytics');
      }
    })();
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return <CardSkeleton />;
  }

  const { overview, subjectWise, weeklyProgress, recentMarks } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Learning analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">Performance, completion, and weekly momentum.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Classes', overview.classrooms],
          ['Assignment completion', `${overview.completionRate}%`],
          ['Quiz attempts', overview.quizAttempts],
          ['Avg mark', overview.averageMarkPercent != null ? `${overview.averageMarkPercent}%` : '—'],
        ].map(([label, val], i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-zyvex-gold">{val}</p>
              {label === 'Assignment completion' && (
                <p className="text-[11px] text-zinc-500 mt-1">
                  {overview.completedAssignments}/{overview.totalAssignments} items
                </p>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Subject-wise performance</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectWise}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000014" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="averagePercent" fill="#c9a227" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Weekly learning activity</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000014" />
                <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="activity" stroke="#c9a227" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Recent marks</p>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {recentMarks.length === 0 && <p className="text-xs text-zinc-500 py-3">No marks recorded yet.</p>}
          {recentMarks.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-zinc-900 dark:text-white">{m.title}</p>
                <p className="text-[11px] text-zinc-500">
                  {m.subject} · {m.classroom}
                </p>
              </div>
              <span className="text-zyvex-gold font-semibold">{m.percent}%</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
