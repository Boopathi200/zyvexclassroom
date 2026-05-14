const express = require('express');
const Attendance = require('../models/Attendance');
const Classroom = require('../models/Classroom');
const { protect, requireRole } = require('../middleware/auth');

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
    const list = await Attendance.find({ classroom: req.params.classroomId })
      .populate('records.student', 'name email')
      .sort({ date: -1 });
    if (req.user.role === 'student') {
      const filtered = list.map((doc) => {
        const o = doc.toObject();
        const mine = o.records.find((r) => r.student && r.student._id.equals(req.user._id));
        return {
          _id: o._id,
          date: o.date,
          topic: o.topic,
          myStatus: mine ? mine.status : 'absent',
        };
      });
      return res.json(filtered);
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId, date, topic, records } = req.body;
    if (!classroomId || !date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'classroomId, date, and records[] required' });
    }
    const c = await Classroom.findById(classroomId);
    if (!c || !c.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only teacher can mark attendance' });
    }
    const day = new Date(date);
    day.setUTCHours(0, 0, 0, 0);
    const att = await Attendance.findOneAndUpdate(
      { classroom: classroomId, date: day },
      {
        topic: topic || '',
        records: records.map((r) => ({
          student: r.studentId,
          status: ['present', 'absent', 'late'].includes(r.status) ? r.status : 'present',
        })),
        markedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(att);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Attendance for this date already exists; use update via same POST' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
