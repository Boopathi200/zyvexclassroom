const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Classroom = require('../models/Classroom');
const { protect, requireRole } = require('../middleware/auth');
const { notifyUsers } = require('../utils/notify');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

async function canAccessClassroom(user, classroomId) {
  const c = await Classroom.findById(classroomId);
  if (!c) return null;
  if (user.role === 'admin') return c;
  if (c.teacher.equals(user._id)) return c;
  if (c.students.some((s) => s.equals(user._id))) return c;
  return null;
}

router.use(protect);

router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const c = await canAccessClassroom(req.user, req.params.classroomId);
    if (!c) return res.status(403).json({ message: 'Forbidden' });
    const assignments = await Assignment.find({ classroom: req.params.classroomId }).sort({ createdAt: -1 });
    if (req.user.role === 'student') {
      const subs = await Submission.find({ student: req.user._id, assignment: { $in: assignments.map((a) => a._id) } });
      const map = Object.fromEntries(subs.map((s) => [String(s.assignment), s]));
      const enriched = assignments.map((a) => ({
        ...a.toObject(),
        mySubmission: map[String(a._id)] || null,
      }));
      return res.json(enriched);
    }
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    const { classroomId, title, description, dueDate } = req.body;
    if (!classroomId || !title) {
      return res.status(400).json({ message: 'classroomId and title are required' });
    }
    const c = await Classroom.findById(classroomId);
    if (!c || !c.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the class teacher can post assignments' });
    }
    let fileUrl = '';
    let fileName = '';
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }
    const assignment = await Assignment.create({
      classroom: classroomId,
      title,
      description: description || '',
      fileUrl,
      fileName,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user._id,
    });
    const studentIds = c.students.map((s) => s.toString());
    await notifyUsers(
      studentIds,
      'New assignment',
      `${title} in ${c.name}`,
      `/dashboard/classrooms/${classroomId}?tab=assignments`
    );
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/submit', requireRole('student'), upload.single('file'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const c = await canAccessClassroom(req.user, assignment.classroom);
    if (!c) return res.status(403).json({ message: 'Forbidden' });
    let fileUrl = '';
    let fileName = '';
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }
    const notes = (req.body.notes || '').toString();
    const submission = await Submission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user._id },
      { fileUrl, fileName, notes },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(submission);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Submission already exists; use update flow' });
    }
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    const c = await Classroom.findById(assignment.classroom);
    if (!c || !c.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    await Submission.deleteMany({ assignment: assignment._id });
    await assignment.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
