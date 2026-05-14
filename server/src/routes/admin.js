const express = require('express');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/stats', async (req, res) => {
  try {
    const [users, classrooms, assignments, quizzes] = await Promise.all([
      User.countDocuments(),
      Classroom.countDocuments(),
      Assignment.countDocuments(),
      Quiz.countDocuments(),
    ]);
    const byRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    res.json({ users, classrooms, assignments, quizzes, byRole });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(200);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
