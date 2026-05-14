import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE, apiForm, apiJson } from '../api.js';
import LiveClassPanel from '../components/classroom/LiveClassPanel.jsx';
import VideoLibraryPanel from '../components/classroom/VideoLibraryPanel.jsx';
import AttendanceInsights from '../components/classroom/AttendanceInsights.jsx';
import { GlassCard } from '../components/ui/GlassCard.jsx';

const tabs = [
  ['overview', 'Overview'],
  ['assignments', 'Assignments'],
  ['quizzes', 'Quizzes'],
  ['videos', 'Videos'],
  ['live', 'Live'],
  ['attendance', 'Attendance'],
  ['insights', 'Insights'],
  ['marks', 'Marks'],
];

export default function ClassroomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'overview';
  const setTab = (t) => {
    setSp({ tab: t });
  };

  const [room, setRoom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [err, setErr] = useState('');

  const isTeacher =
    user?.role === 'teacher' && room?.teacher && String(room.teacher._id) === String(user?.id);
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  const reloadRoom = () => apiJson(`/api/classrooms/${id}`).then(setRoom);

  useEffect(() => {
    reloadRoom().catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (!room) return;
    const load = async () => {
      try {
        const [a, q, att, m, live, vids] = await Promise.all([
          apiJson(`/api/assignments/classroom/${id}`),
          apiJson(`/api/quizzes/classroom/${id}`),
          apiJson(`/api/attendance/classroom/${id}`),
          apiJson(`/api/marks/classroom/${id}`),
          apiJson(`/api/live-sessions/classroom/${id}`),
          apiJson(`/api/videos/classroom/${id}`),
        ]);
        setAssignments(a);
        setQuizzes(q);
        setAttendance(att);
        setMarks(m);
        setLiveSessions(live);
        setVideos(vids);
      } catch (e) {
        setErr(e.message);
      }
    };
    load();
  }, [room, id]);

  if (err && !room) return <p className="text-red-400">{err}</p>;
  if (!room) return <p className="text-zinc-500">Loading…</p>;

  const teacherControls = isTeacher || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-xs text-zinc-500 hover:text-zyvex-gold">
            ← Back
          </Link>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white mt-2">{room.name}</h1>
          <p className="text-zinc-500 mt-1 max-w-2xl">{room.description}</p>
        </div>
        <div className="rounded-xl border border-zyvex-gold/30 bg-white/60 px-4 py-3 text-center shadow-inner dark:bg-black/50">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Join code</p>
          <p className="font-mono text-2xl font-bold text-zyvex-gold tracking-[0.2em]">{room.code}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-black/10 dark:border-white/10">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-2 rounded-t-lg text-sm font-medium transition ${
              tab === key
                ? 'bg-zyvex-gold/15 text-zyvex-gold border border-b-0 border-zyvex-gold/30 dark:text-zyvex-goldlight'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Teacher</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">{room.teacher?.name}</p>
            <p className="text-sm text-zinc-500">{room.teacher?.email}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Students ({room.students?.length || 0})</h3>
            <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto text-sm text-zinc-600 dark:text-zinc-400">
              {room.students?.map((s) => (
                <li key={s._id}>
                  {s.name} <span className="text-zinc-500">· {s.email}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      {tab === 'assignments' && (
        <AssignmentsSection
          classroomId={id}
          assignments={assignments}
          teacherControls={teacherControls}
          isStudent={isStudent}
          onRefresh={async () => {
            setAssignments(await apiJson(`/api/assignments/classroom/${id}`));
          }}
        />
      )}

      {tab === 'quizzes' && (
        <QuizzesSection
          classroomId={id}
          quizzes={quizzes}
          teacherControls={teacherControls}
          isStudent={isStudent}
          onRefresh={async () => {
            setQuizzes(await apiJson(`/api/quizzes/classroom/${id}`));
          }}
        />
      )}

      {tab === 'videos' && (
        <VideoLibraryPanel
          classroomId={id}
          teacherControls={teacherControls}
          videos={videos}
          onRefresh={async () => {
            setVideos(await apiJson(`/api/videos/classroom/${id}`));
          }}
        />
      )}

      {tab === 'live' && (
        <LiveClassPanel
          classroomId={id}
          teacherControls={teacherControls}
          isStudent={isStudent}
          sessions={liveSessions}
          onRefresh={async () => {
            setLiveSessions(await apiJson(`/api/live-sessions/classroom/${id}`));
          }}
        />
      )}

      {tab === 'attendance' && (
        <AttendanceSection
          classroomId={id}
          room={room}
          rows={attendance}
          teacherControls={teacherControls}
          isStudent={isStudent}
          onRefresh={async () => {
            setAttendance(await apiJson(`/api/attendance/classroom/${id}`));
          }}
        />
      )}

      {tab === 'insights' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Visualize attendance trends for this class. Students see their own mix; teachers see the full cohort.
          </p>
          <AttendanceInsights
            classroomId={id}
            isStudent={isStudent}
            teacherControls={teacherControls}
          />
        </div>
      )}

      {tab === 'marks' && (
        <MarksSection
          classroomId={id}
          marks={marks}
          students={room.students || []}
          teacherControls={teacherControls}
          isStudent={isStudent}
          onRefresh={async () => {
            setMarks(await apiJson(`/api/marks/classroom/${id}`));
          }}
        />
      )}
    </div>
  );
}

function AssignmentsSection({ classroomId, assignments, teacherControls, isStudent, onRefresh }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('classroomId', classroomId);
      fd.append('title', title);
      fd.append('description', description);
      if (due) fd.append('dueDate', due);
      if (file) fd.append('file', file);
      await apiForm('/api/assignments', fd);
      setTitle('');
      setDescription('');
      setDue('');
      setFile(null);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const submitWork = async (assignmentId, f) => {
    const fd = new FormData();
    if (f) fd.append('file', f);
    await apiForm(`/api/assignments/${assignmentId}/submit`, fd);
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      {teacherControls && (
        <form onSubmit={create} className="rounded-2xl border border-white/10 p-5 bg-white/[0.02] space-y-3">
          <h3 className="font-semibold text-white">New assignment</h3>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm min-h-[70px]"
            placeholder="Instructions"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input type="datetime-local" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" value={due} onChange={(e) => setDue(e.target.value)} />
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400" />
          <button disabled={busy} type="submit" className="rounded-lg bg-zyvex-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            Publish
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {assignments.map((a) => (
          <li key={a._id} className="rounded-xl border border-white/10 p-4 bg-black/30">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium text-white">{a.title}</p>
                <p className="text-sm text-zinc-500 mt-1">{a.description}</p>
                {a.dueDate && <p className="text-xs text-zyvex-gold mt-2">Due {new Date(a.dueDate).toLocaleString()}</p>}
              </div>
              {a.fileUrl && (
                <a
                  href={`${API_BASE}${a.fileUrl}`}
                  className="text-xs text-zyvex-goldlight underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download material
                </a>
              )}
            </div>
            {isStudent && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input type="file" onChange={(e) => submitWork(a._id, e.target.files?.[0])} className="text-xs text-zinc-400" />
                {a.mySubmission?.fileUrl && (
                  <span className="text-xs text-emerald-400">Submitted — view file in grades tab or re-upload to replace.</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuizzesSection({ classroomId, quizzes, teacherControls, isStudent, onRefresh }) {
  const [title, setTitle] = useState('');
  const [qJson, setQJson] = useState(
    JSON.stringify(
      [
        {
          text: 'Sample: 2 + 2 = ?',
          options: ['3', '4', '5', '22'],
          correctIndex: 1,
        },
      ],
      null,
      2
    )
  );
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let questions;
      try {
        questions = JSON.parse(qJson);
      } catch {
        alert('Invalid JSON for questions');
        setBusy(false);
        return;
      }
      await apiJson('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify({ classroomId, title, questions, timeLimitMinutes: 20 }),
      });
      setTitle('');
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {teacherControls && (
        <form onSubmit={create} className="rounded-2xl border border-white/10 p-5 bg-white/[0.02] space-y-3">
          <h3 className="font-semibold text-white">Create quiz (JSON questions)</h3>
          <p className="text-xs text-zinc-500">
            Array of objects: <code className="text-zyvex-gold">text</code>, <code className="text-zyvex-gold">options</code>{' '}
            (array of strings), <code className="text-zyvex-gold">correctIndex</code> (0-based).
          </p>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            placeholder="Quiz title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono min-h-[200px]"
            value={qJson}
            onChange={(e) => setQJson(e.target.value)}
          />
          <button disabled={busy} type="submit" className="rounded-lg bg-zyvex-gold px-4 py-2 text-sm font-semibold text-black">
            Save quiz
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {quizzes.map((q) => (
          <li key={q._id} className="rounded-xl border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">{q.title}</p>
              <p className="text-xs text-zinc-500 mt-1">{q.questions?.length || 0} questions</p>
              {isStudent && q.myAttempt && (
                <p className="text-xs text-zyvex-gold mt-1">
                  Your score: {q.myAttempt.score}/{q.myAttempt.maxScore}
                </p>
              )}
            </div>
            {isStudent && !q.myAttempt && (
              <Link
                to={`/dashboard/classrooms/${classroomId}/quiz/${q._id}`}
                className="rounded-lg border border-zyvex-gold/40 px-3 py-1.5 text-sm text-zyvex-goldlight hover:bg-zyvex-gold/10"
              >
                Take quiz
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AttendanceSection({ classroomId, room, rows, teacherControls, isStudent, onRefresh }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState('');
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    const m = {};
    (room.students || []).forEach((s) => {
      m[s._id] = 'present';
    });
    setStatusMap(m);
  }, [room.students]);

  const save = async (e) => {
    e.preventDefault();
    const records = Object.entries(statusMap).map(([studentId, status]) => ({ studentId, status }));
    await apiJson('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ classroomId, date, topic, records }),
    });
    await onRefresh();
  };

  if (isStudent) {
    return (
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r._id} className="rounded-lg border border-white/10 px-4 py-3 flex justify-between text-sm">
            <span className="text-zinc-400">{new Date(r.date).toLocaleDateString()}</span>
            <span className="text-white capitalize">{r.myStatus}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (!teacherControls) {
    return <p className="text-zinc-500 text-sm">Attendance is visible to class members.</p>;
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-white/10 p-5 bg-white/[0.02]">
      <div className="flex flex-wrap gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" />
        <input
          className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          placeholder="Session topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-white/10">
              <th className="py-2">Student</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(room.students || []).map((s) => (
              <tr key={s._id} className="border-b border-white/5">
                <td className="py-2 text-white">{s.name}</td>
                <td className="py-2">
                  <select
                    className="rounded-md border border-white/10 bg-black/40 px-2 py-1"
                    value={statusMap[s._id] || 'present'}
                    onChange={(e) => setStatusMap((m) => ({ ...m, [s._id]: e.target.value }))}
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="submit" className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold">
        Save attendance
      </button>
    </form>
  );
}

function MarksSection({ classroomId, marks, students, teacherControls, isStudent, onRefresh }) {
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');

  const save = async (e) => {
    e.preventDefault();
    await apiJson('/api/marks', {
      method: 'POST',
      body: JSON.stringify({
        classroomId,
        studentId,
        subject,
        title,
        score: Number(score),
        maxScore: Number(maxScore),
      }),
    });
    setTitle('');
    setSubject('');
    setScore('');
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      {teacherControls && (
        <form onSubmit={save} className="rounded-2xl border border-black/10 dark:border-white/10 p-5 bg-white/50 dark:bg-white/[0.02] grid sm:grid-cols-2 gap-3">
          <select
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
            placeholder="Subject (e.g. Algebra)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <input
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
            placeholder="Item (e.g. Midterm)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="number"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
            placeholder="Score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
          />
          <input
            type="number"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
            placeholder="Max"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            required
          />
          <button type="submit" className="sm:col-span-2 rounded-lg bg-zyvex-gold py-2 text-sm font-semibold text-black">
            Record mark
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/40 dark:bg-transparent">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
              {!isStudent && <th className="px-4 py-3">Student</th>}
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {marks.map((m) => (
              <tr key={m._id} className="border-b border-black/5 dark:border-white/5">
                {!isStudent && <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{m.student?.name}</td>}
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{m.subject || '—'}</td>
                <td className="px-4 py-2 text-zinc-900 dark:text-white">{m.title}</td>
                <td className="px-4 py-2 text-zyvex-gold">
                  {m.score}/{m.maxScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
