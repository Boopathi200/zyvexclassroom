import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { apiJson } from '../../api.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { CardSkeleton } from '../ui/Skeleton.jsx';

const COLORS = ['#34d399', '#f87171', '#fbbf24'];

export default function AttendanceInsights({ classroomId, isStudent, teacherControls }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await apiJson(`/api/analytics/attendance/${classroomId}`);
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  if (loading) {
    return <CardSkeleton />;
  }
  if (!data) {
    return <p className="text-sm text-zinc-500">No attendance analytics yet.</p>;
  }

  if (isStudent && data.role === 'student') {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Attendance mix</p>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" nameKey="name" data={data.pie} innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.pie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-300 mt-2">
            Estimated attendance score: <span className="text-zyvex-gold font-semibold">{data.summary.percent}%</span>
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Monthly presence</p>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0a0a0b', border: '1px solid #ffffff22' }} />
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#34d399" />
                <Bar dataKey="late" stackId="a" fill="#fbbf24" />
                <Bar dataKey="absent" stackId="a" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (teacherControls && data.role === 'teacher') {
    return (
      <div className="space-y-6">
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4">Student attendance %</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.perStudent}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d855" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="percent" fill="#c9a227" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4">Class-wide monthly totals</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d855" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#34d399" />
                <Bar dataKey="late" stackId="a" fill="#fbbf24" />
                <Bar dataKey="absent" stackId="a" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    );
  }

  return <p className="text-sm text-zinc-500">Insights unlock after attendance records exist.</p>;
}
