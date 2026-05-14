const express = require('express');
const LiveSession = require('../models/LiveSession');
const Classroom = require('../models/Classroom');
const { protect, requireRole } = require('../middleware/auth');
const { notifyUsers } = require('../utils/notify');

const router = express.Router();

router.use(protect);

async function assertClassMember(user, classroomId) {
  const c = await Classroom.findById(classroomId);
  if (!c) return null;
  if (user.role === 'admin') return c;
  if (c.teacher.equals(user._id)) return c;
  if (c.students.some((s) => s.equals(user._id))) return c;
  return null;
}

function emitLive(req, classroomId, payload) {
  const io = req.app.get('io');
  if (io) io.to(`classroom:${classroomId}`).emit('live:session', payload);
}

router.get('/schedule', async (req, res) => {
  try {
    const now = new Date();
    const horizon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 42);
    let classroomIds = [];
    if (req.user.role === 'teacher') {
      const list = await Classroom.find({ teacher: req.user._id }).select('_id');
      classroomIds = list.map((x) => x._id);
    } else if (req.user.role === 'student') {
      const list = await Classroom.find({ students: req.user._id }).select('_id');
      classroomIds = list.map((x) => x._id);
    } else {
      const list = await Classroom.find().select('_id').limit(200);
      classroomIds = list.map((x) => x._id);
    }
    const from = new Date(now.getTime() - 1000 * 60 * 60 * 24);
    const sessions = await LiveSession.find({
      classroom: { $in: classroomIds },
      scheduledAt: { $gte: from, $lte: horizon },
    })
      .populate('classroom', 'name code')
      .sort({ scheduledAt: 1 })
      .limit(200);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const c = await assertClassMember(req.user, req.params.classroomId);
    if (!c) return res.status(403).json({ message: 'Forbidden' });
    const sessions = await LiveSession.find({ classroom: req.params.classroomId }).sort({ scheduledAt: -1 }).limit(80);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId, title, description, scheduledAt } = req.body;
    if (!classroomId || !title || !scheduledAt) {
      return res.status(400).json({ message: 'classroomId, title, scheduledAt required' });
    }
    const c = await Classroom.findById(classroomId);
    if (!c || !c.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only class teacher can schedule live sessions' });
    }
    const session = await LiveSession.create({
      classroom: classroomId,
      title,
      description: description || '',
      scheduledAt: new Date(scheduledAt),
      createdBy: req.user._id,
    });
    const studentIds = c.students.map((s) => s.toString());
    await notifyUsers(
      studentIds,
      'Live class scheduled',
      `${title} — ${new Date(scheduledAt).toLocaleString()}`,
      `/dashboard/classrooms/${classroomId}?tab=live`
    );
    emitLive(req, classroomId, { type: 'created', session: session.toObject() });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/start', requireRole('teacher'), async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    const c = await Classroom.findById(session.classroom);
    if (!c || !c.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    session.status = 'live';
    session.startedAt = new Date();
    await session.save();
    const studentIds = c.students.map((s) => s.toString());
    await notifyUsers(studentIds, 'Live class started', session.title, `/dashboard/classrooms/${c._id}?tab=live`);
    emitLive(req, String(session.classroom), { type: 'started', session: session.toObject() });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/end', requireRole('teacher'), async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    const c = await Classroom.findById(session.classroom);
    if (!c || !c.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();
    emitLive(req, String(session.classroom), { type: 'ended', session: session.toObject() });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    const c = await Classroom.findById(session.classroom);
    if (!c || !c.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    const cid = String(session.classroom);
    await session.deleteOne();
    emitLive(req, cid, { type: 'deleted', id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
