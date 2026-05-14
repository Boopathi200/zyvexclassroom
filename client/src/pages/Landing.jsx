import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-grid-fade flex flex-col">
      <header className="border-b border-black/10 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-black/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-lg font-semibold">
            <span className="text-gradient-gold">Zyvex</span>
            <span className="text-zinc-900 dark:text-white"> Classroom</span>
          </span>
          <div className="flex gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-zyvex-gold px-4 py-2 text-sm font-semibold text-black hover:bg-zyvex-goldlight transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-black/15 px-4 py-2 text-sm text-zinc-700 hover:border-zyvex-gold/50 dark:border-white/20 dark:text-zinc-200 transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-zyvex-gold px-4 py-2 text-sm font-semibold text-black hover:bg-zyvex-goldlight transition"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-zyvex-gold text-xs font-semibold tracking-[0.25em] uppercase mb-4">Premium learning ops</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white max-w-3xl leading-tight">
          Run your classroom with <span className="text-gradient-gold">clarity</span> and control
        </h1>
        <p className="mt-6 text-zinc-600 dark:text-zinc-400 max-w-xl text-lg">
          Assignments, quizzes, attendance, and marks — unified for teachers and students with a refined black, white, and gold
          experience.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            to="/register"
            className="rounded-xl bg-zyvex-gold px-8 py-3 text-sm font-semibold text-black shadow-gold hover:bg-zyvex-goldlight transition"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-black/15 px-8 py-3 text-sm font-medium text-zinc-800 hover:border-zyvex-gold/40 dark:border-white/20 dark:text-white transition"
          >
            I already have access
          </Link>
        </div>

        <div className="mt-24 grid sm:grid-cols-3 gap-6 max-w-4xl w-full text-left">
          {[
            ['Teachers', 'Create classes, upload assignments, build quizzes, mark attendance, and publish grades.'],
            ['Students', 'Join with a class code, submit work, take quizzes, and track your progress.'],
            ['Admins', 'Monitor usage, users, and platform health from a dedicated console.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-card">
              <h3 className="font-display text-lg font-semibold text-zyvex-gold dark:text-zyvex-goldlight">{t}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-black/10 py-6 text-center text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-600">
        © {new Date().getFullYear()} Zyvex Classroom
      </footer>
    </div>
  );
}
