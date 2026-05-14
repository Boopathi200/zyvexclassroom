const express = require('express');
const Mark = require('../models/Mark');
const Classroom = require('../models/Classroom');
const { protect, requireRole } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');

const router = express.Router();

router.use(protect);

router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const c = await Classroom.findById(req.params.classroomId);
    if (!c) return res.status(404).json({ message: 'Class not found' });
    const isTeacher = c.teacher.equals(req.user._id);
    const isStudent = c.students.some((s) => s.equals(req.user._id));
    const isAdmin = req.user.role === 'admin';
    if (!isTeacher && !isStudent && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const filter = { classroom: req.params.classroomId };
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }
    const marks = await Mark.find(filter).populate('student', 'name email').sort({ createdAt: -1 });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId, studentId, title, score, maxScore } = req.body;
    if (!classroomId || !studentId || !title || score === undefined || !maxScore) {
      return res.status(400).json({ message: 'classroomId, studentId, title, score, maxScore required' });
    }
    const c = await Classroom.findById(classroomId);
    if (!c || !c.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!c.students.some((s) => s.equals(studentId))) {
      return res.status(400).json({ message: 'Student is not in this class' });
    }
    const mark = await Mark.create({
      classroom: classroomId,
      student: studentId,
      subject: (req.body.subject || '').toString().trim(),
      title,
      score: Number(score),
      maxScore: Number(maxScore),
      createdBy: req.user._id,
    });
    await notifyUser(
      studentId,
      'New grade posted',
      `${title}: ${score}/${maxScore}`,
      `/dashboard/classrooms/${classroomId}?tab=marks`
    );
    res.status(201).json(mark);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id);
    if (!mark) return res.status(404).json({ message: 'Not found' });
    const c = await Classroom.findById(mark.classroom);
    if (!c || !c.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    await mark.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
