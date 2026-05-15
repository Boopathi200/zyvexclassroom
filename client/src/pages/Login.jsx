import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      nav(loc.state?.from || '/dashboard', { replace: true });
    } catch (er) {
      setErr(er.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zyvex-black">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zyvex-charcoal/60 p-8 shadow-card backdrop-blur">
        <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to continue to Zyvex Classroom.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm outline-none focus:border-zyvex-gold/50"
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm outline-none focus:border-zyvex-gold/50"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-zyvex-gold py-2.5 text-sm font-semibold text-black hover:bg-zyvex-goldlight transition"
          >
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          New here?{' '}
          <Link to="/register" className="text-zyvex-gold hover:text-zyvex-goldlight">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
