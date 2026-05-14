import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiJson } from '../api.js';

export default function DashboardHome() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const list = await apiJson('/api/classrooms');
    setClassrooms(list);
  };

  useEffect(() => {
    load().catch(() => setClassrooms([]));
  }, []);

  const join = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await apiJson('/api/classrooms/join', { method: 'POST', body: JSON.stringify({ code }) });
      setCode('');
      setMsg('Joined successfully.');
      await load();
    } catch (er) {
      setMsg(er.message);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await apiJson('/api/classrooms', { method: 'POST', body: JSON.stringify({ name, description: desc }) });
      setName('');
      setDesc('');
      setMsg('Classroom created.');
      await load();
    } catch (er) {
      setMsg(er.message);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Hello, {user?.name}</h1>
        <p className="text-zinc-500 mt-1">Your classes and quick actions in one place.</p>
      </div>

      {msg && (
        <p className="rounded-lg border border-zyvex-gold/30 bg-zyvex-gold/10 px-4 py-2 text-sm text-zyvex-goldlight">{msg}</p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {user?.role === 'student' && (
          <form onSubmit={join} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-display text-lg font-semibold text-white">Join a classroom</h2>
            <p className="text-sm text-zinc-500 mt-1">Enter the six-character code from your teacher.</p>
            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-zyvex-gold/50"
                placeholder="CODE"
                value={code}
                maxLength={8}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zyvex-goldlight transition"
              >
                Join
              </button>
            </div>
          </form>
        )}

        {user?.role === 'teacher' && (
          <form onSubmit={create} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-display text-lg font-semibold text-white">Create classroom</h2>
            <p className="text-sm text-zinc-500 mt-1">A unique join code is generated automatically.</p>
            <input
              className="mt-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zyvex-gold/50"
              placeholder="Class name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zyvex-gold/50 min-h-[80px]"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-zyvex-gold py-2 text-sm font-semibold text-black hover:bg-zyvex-goldlight transition"
            >
              Create
            </button>
          </form>
        )}

        {user?.role === 'admin' && (
          <div className="rounded-2xl border border-zyvex-gold/20 bg-zyvex-gold/5 p-6">
            <h2 className="font-display text-lg font-semibold text-zyvex-goldlight">Administrator</h2>
            <p className="text-sm text-zinc-400 mt-1">Open the admin console for platform-wide metrics and user directory.</p>
            <Link
              to="/dashboard/admin"
              className="inline-block mt-4 rounded-lg border border-zyvex-gold/40 px-4 py-2 text-sm font-medium text-zyvex-goldlight hover:bg-zyvex-gold/10 transition"
            >
              Go to admin dashboard
            </Link>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4">Your classrooms</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {classrooms.length === 0 && <p className="text-zinc-500 text-sm">No classrooms yet.</p>}
          {classrooms.map((c) => (
            <Link
              key={c._id}
              to={`/dashboard/classrooms/${c._id}`}
              className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5 hover:border-zyvex-gold/40 transition shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-white group-hover:text-zyvex-goldlight transition">{c.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{c.description}</p>
                </div>
                <span className="shrink-0 rounded-md border border-zyvex-gold/30 bg-black/50 px-2 py-1 text-[10px] font-mono text-zyvex-gold">
                  {c.code}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
