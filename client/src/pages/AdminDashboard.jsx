import { useEffect, useState } from 'react';
import { apiJson } from '../api.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, u] = await Promise.all([apiJson('/api/admin/stats'), apiJson('/api/admin/users')]);
        setStats(s);
        setUsers(u);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) {
    return <p className="text-red-400">{err}</p>;
  }

  if (!stats) {
    return <p className="text-zinc-500">Loading admin data…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Admin dashboard</h1>
        <p className="text-zinc-500 mt-1">High-level visibility across Zyvex Classroom.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Users', stats.users],
          ['Classrooms', stats.classrooms],
          ['Assignments', stats.assignments],
          ['Quizzes', stats.quizzes],
        ].map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-zyvex-goldlight">{val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <h2 className="font-display text-lg font-semibold text-white">Recent users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-white/10">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-white">{u.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-5 py-3 capitalize text-zyvex-gold">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
