import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [err, setErr] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await register({ name, email, password, role });
      nav('/dashboard', { replace: true });
    } catch (er) {
      setErr(er.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zyvex-black">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zyvex-charcoal/60 p-8 shadow-card backdrop-blur">
        <h1 className="font-display text-2xl font-bold text-white">Create your Zyvex account</h1>
        <p className="mt-1 text-sm text-zinc-500">Students and teachers can self-serve. Admins are provisioned separately.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Full name</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm outline-none focus:border-zyvex-gold/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm outline-none focus:border-zyvex-gold/50"
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Password (min 6)</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm outline-none focus:border-zyvex-gold/50"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {['student', 'teacher'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border py-2 text-sm capitalize transition ${
                    role === r
                      ? 'border-zyvex-gold bg-zyvex-gold/10 text-zyvex-goldlight'
                      : 'border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-zyvex-gold py-2.5 text-sm font-semibold text-black hover:bg-zyvex-goldlight transition"
          >
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already registered?{' '}
          <Link to="/login" className="text-zyvex-gold hover:text-zyvex-goldlight">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
