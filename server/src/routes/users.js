const express = require('express');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const LectureVideo = require('../models/LectureVideo');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/search', protect, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (q.length < 2) {
      return res.json({ classrooms: [], assignments: [], videos: [] });
    }
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    let classroomFilter = {};
    if (req.user.role === 'teacher') {
      classroomFilter = { teacher: req.user._id };
    } else if (req.user.role === 'student') {
      classroomFilter = { students: req.user._id };
    }
    const classrooms = await Classroom.find({ ...classroomFilter, $or: [{ name: rx }, { description: rx }] })
      .select('name description code')
      .limit(20);
    const classIds = classrooms.map((c) => c._id);
    const [assignments, videos] = await Promise.all([
      Assignment.find({ classroom: { $in: classIds }, $or: [{ title: rx }, { description: rx }] })
        .select('title classroom createdAt')
        .populate('classroom', 'name')
        .limit(20),
      LectureVideo.find({ classroom: { $in: classIds }, $or: [{ title: rx }, { subject: rx }, { description: rx }] })
        .select('title subject classroom createdAt')
        .populate('classroom', 'name')
        .limit(20),
    ]);
    res.json({ classrooms, assignments, videos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/me', protect, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (name && typeof name === 'string') user.name = name.trim().slice(0, 80);
    if (preferences?.theme === 'light' || preferences?.theme === 'dark') {
      user.preferences = user.preferences || {};
      user.preferences.theme = preferences.theme;
    }
    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences || { theme: 'dark' },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
