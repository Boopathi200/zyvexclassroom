import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiJson } from '../api.js';

export default function QuizTake() {
  const { id, quizId } = useParams();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiJson(`/api/quizzes/${quizId}`)
      .then((q) => {
        if (q.submitted) {
          setQuiz(q);
          return;
        }
        setQuiz(q);
        setAnswers(q.questions.map(() => 0));
      })
      .catch((e) => setErr(e.message));
  }, [quizId]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await apiJson(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
      nav(`/dashboard/classrooms/${id}?tab=quizzes`, { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  };

  if (err && !quiz) return <p className="text-red-400">{err}</p>;
  if (!quiz) return <p className="text-zinc-500">Loading…</p>;
  if (quiz.submitted) {
    return (
      <div className="max-w-lg mx-auto space-y-4 text-center py-12">
        <p className="text-white font-display text-xl">Already submitted</p>
        <p className="text-zinc-400 text-sm">
          Score: {quiz.attempt?.score}/{quiz.attempt?.maxScore}
        </p>
        <Link to={`/dashboard/classrooms/${id}?tab=quizzes`} className="text-zyvex-gold underline text-sm">
          Back to class
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to={`/dashboard/classrooms/${id}?tab=quizzes`} className="text-xs text-zinc-500 hover:text-zyvex-gold">
        ← Back
      </Link>
      <h1 className="font-display text-2xl font-bold text-white">{quiz.title}</h1>
      {quiz.description && <p className="text-sm text-zinc-500">{quiz.description}</p>}
      {err && <p className="text-sm text-red-400">{err}</p>}
      <form onSubmit={submit} className="space-y-6">
        {quiz.questions.map((q, qi) => (
          <fieldset key={qi} className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
            <legend className="text-sm font-medium text-white px-1">
              Question {qi + 1}: {q.text}
            </legend>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => {
                      setAnswers((prev) => {
                        const n = [...prev];
                        n[qi] = oi;
                        return n;
                      });
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit" className="w-full rounded-lg bg-zyvex-gold py-3 text-sm font-semibold text-black hover:bg-zyvex-goldlight">
          Submit quiz
        </button>
      </form>
    </div>
  );
}
