const express = require('express');
const Classroom = require('../models/Classroom');
const { protect, requireRole } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    let list = [];
    if (req.user.role === 'teacher') {
      list = await Classroom.find({ teacher: req.user._id }).sort({ updatedAt: -1 });
    } else if (req.user.role === 'student') {
      list = await Classroom.find({ students: req.user._id }).sort({ updatedAt: -1 });
    } else if (req.user.role === 'admin') {
      list = await Classroom.find().populate('teacher', 'name email').sort({ updatedAt: -1 }).limit(100);
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const classroom = await Classroom.create({
      name,
      description: description || '',
      teacher: req.user._id,
    });
    res.status(201).json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/join', requireRole('student'), async (req, res) => {
  try {
    const code = (req.body.code || '').toString().trim().toUpperCase();
    if (!code) return res.status(400).json({ message: 'Class code is required' });
    const classroom = await Classroom.findOne({ code });
    if (!classroom) return res.status(404).json({ message: 'Invalid class code' });
    if (classroom.students.some((s) => s.equals(req.user._id))) {
      return res.json(classroom);
    }
    classroom.students.push(req.user._id);
    await classroom.save();
    await notifyUser(
      classroom.teacher,
      'New student joined',
      `${req.user.name} joined ${classroom.name}`,
      `/dashboard/classrooms/${classroom._id}`
    );
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id).populate('teacher', 'name email').populate('students', 'name email');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    const isTeacher = classroom.teacher._id.equals(req.user._id);
    const isStudent = classroom.students.some((s) => s._id.equals(req.user._id));
    const isAdmin = req.user.role === 'admin';
    if (!isTeacher && !isStudent && !isAdmin) {
      return res.status(403).json({ message: 'Not a member of this classroom' });
    }
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (!classroom.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can delete' });
    }
    await classroom.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
