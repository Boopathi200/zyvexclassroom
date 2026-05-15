const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const storePath = path.join(os.tmpdir(), 'zyvexclassroom-demo-store.json');
const jwtSecret =
  process.env.JWT_SECRET ||
  process.env.DEMO_JWT_SECRET ||
  'zyvex-demo-secret-change-me-after-adding-mongodb';

function loadStore() {
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      classrooms: Array.isArray(parsed.classrooms) ? parsed.classrooms : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    };
  } catch {
    return { users: [], classrooms: [], notifications: [] };
  }
}

function saveStore(store) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  } catch {
    // Demo mode is allowed to be ephemeral when the host filesystem is read-only.
  }
}

function publicUser(user) {
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferences: user.preferences || { theme: 'dark' },
  };
}

function signToken(id) {
  return jwt.sign({ id }, jwtSecret, { expiresIn: '30d' });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const store = loadStore();
    const user = store.users.find((u) => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.demoStore = store;
    req.user = publicUser(user);
    return next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}

function code() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

router.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
  if (!['student', 'teacher'].includes(role)) return res.status(400).json({ message: 'Role must be student or teacher' });

  const store = loadStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.users.some((u) => u.email === normalizedEmail)) return res.status(400).json({ message: 'Email already registered' });

  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role,
    preferences: { theme: 'dark' },
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  saveStore(store);
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const store = loadStore();
  const user = store.users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: signToken(user.id), user: publicUser(user) });
});

router.get('/auth/me', auth, (req, res) => {
  res.json({ user: req.user });
});

router.patch('/users/me', auth, (req, res) => {
  const store = req.demoStore || loadStore();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (typeof req.body?.name === 'string' && req.body.name.trim()) user.name = req.body.name.trim();
  if (req.body?.preferences) user.preferences = { ...(user.preferences || {}), ...req.body.preferences };
  saveStore(store);
  res.json({ user: publicUser(user) });
});

router.get('/users/search', auth, (_req, res) => res.json([]));

router.get('/classrooms', auth, (req, res) => {
  const store = req.demoStore || loadStore();
  const list = store.classrooms.filter((room) => {
    if (req.user.role === 'teacher') return room.teacher === req.user.id;
    if (req.user.role === 'student') return room.students.includes(req.user.id);
    return true;
  });
  res.json(list);
});

router.post('/classrooms', auth, requireRole('teacher'), (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const store = req.demoStore || loadStore();
  const room = {
    _id: crypto.randomUUID(),
    name: String(name).trim(),
    description: description || '',
    code: code(),
    teacher: req.user.id,
    students: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.classrooms.push(room);
  saveStore(store);
  res.status(201).json(room);
});

router.post('/classrooms/join', auth, requireRole('student'), (req, res) => {
  const store = req.demoStore || loadStore();
  const room = store.classrooms.find((c) => c.code === String(req.body?.code || '').trim().toUpperCase());
  if (!room) return res.status(404).json({ message: 'Invalid class code' });
  if (!room.students.includes(req.user.id)) room.students.push(req.user.id);
  saveStore(store);
  res.json(room);
});

router.get('/classrooms/:id', auth, (req, res) => {
  const store = req.demoStore || loadStore();
  const room = store.classrooms.find((c) => c._id === req.params.id);
  if (!room) return res.status(404).json({ message: 'Classroom not found' });
  res.json(room);
});

router.get('/notifications', auth, (_req, res) => res.json([]));
router.patch('/notifications/:id/read', auth, (_req, res) => res.json({ message: 'OK' }));
router.patch('/notifications/read-all', auth, (_req, res) => res.json({ message: 'OK' }));

router.post('/chat', auth, (req, res) => {
  res.json({
    reply: `Zyvex Classroom is online. You asked: "${String(req.body?.message || '').slice(0, 160)}"`,
    suggestions: ['How do I create a classroom?', 'Where are live classes scheduled?', 'How do I submit an assignment?'],
  });
});

router.get('/admin/stats', auth, requireRole('admin'), (_req, res) => res.json({ users: 0, classrooms: 0, assignments: 0, quizzes: 0 }));
router.get('/admin/users', auth, requireRole('admin'), (_req, res) => res.json([]));

router.get('/analytics/student', auth, (_req, res) =>
  res.json({
    overview: { classrooms: 0, completionRate: 100, totalAssignments: 0, completedAssignments: 0, quizAttempts: 0, averageMarkPercent: null },
    subjectWise: [],
    weeklyProgress: [],
    recentMarks: [],
  })
);
router.get('/analytics/attendance/:classroomId', auth, (_req, res) =>
  res.json({ role: 'student', summary: { present: 0, absent: 0, late: 0, percent: 100 }, pie: [], monthlyChart: [] })
);

router.get('/assignments/classroom/:id', auth, (_req, res) => res.json([]));
router.get('/quizzes/classroom/:id', auth, (_req, res) => res.json([]));
router.get('/attendance/classroom/:id', auth, (_req, res) => res.json([]));
router.get('/marks/classroom/:id', auth, (_req, res) => res.json([]));
router.get('/live-sessions/classroom/:id', auth, (_req, res) => res.json([]));
router.get('/live-sessions/schedule', auth, (_req, res) => res.json([]));
router.get('/videos/classroom/:id', auth, (_req, res) => res.json([]));

module.exports = router;
