const express = require('express');
const Mark = require('../models/Mark');
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const QuizAttempt = require('../models/QuizAttempt');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

async function assertClassroomAccess(user, classroomId) {
  const c = await Classroom.findById(classroomId).populate('students', 'name email');
  if (!c) return null;
  if (user.role === 'admin') return c;
  if (c.teacher.equals(user._id)) return c;
  if (c.students.some((s) => (s._id || s).equals(user._id))) return c;
  return null;
}

router.get('/student', async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student analytics only' });
    }
    const classrooms = await Classroom.find({ students: req.user._id }).select('name');
    const classIds = classrooms.map((c) => c._id);

    const marks = await Mark.find({ student: req.user._id, classroom: { $in: classIds } })
      .populate('classroom', 'name')
      .sort({ createdAt: -1 });

    const assignments = await Assignment.find({ classroom: { $in: classIds } });
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({ student: req.user._id, assignment: { $in: assignmentIds } });
    const submittedSet = new Set(submissions.map((s) => String(s.assignment)));

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter((a) => submittedSet.has(String(a._id))).length;
    const completionRate = totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 100;

    const attempts = await QuizAttempt.find({ student: req.user._id }).populate({
      path: 'quiz',
      select: 'title classroom',
      populate: { path: 'classroom', select: 'name' },
    });

    const subjectMap = {};
    marks.forEach((m) => {
      const label = (m.subject && m.subject.trim()) || m.classroom?.name || 'General';
      if (!subjectMap[label]) subjectMap[label] = { scores: [], count: 0 };
      subjectMap[label].scores.push((m.score / m.maxScore) * 100);
      subjectMap[label].count += 1;
    });
    const subjectWise = Object.entries(subjectMap).map(([name, v]) => ({
      name,
      averagePercent: v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0,
      items: v.count,
    }));

    const weeks = [];
    const now = new Date();
    for (let i = 3; i >= 0; i -= 1) {
      const start = new Date(now);
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const subCount = submissions.filter((s) => s.createdAt >= start && s.createdAt < end).length;
      const quizCount = attempts.filter((a) => a.createdAt >= start && a.createdAt < end).length;
      weeks.push({
        label: `Week ${4 - i}`,
        start: start.toISOString(),
        activity: subCount + quizCount,
      });
    }

    const recentMarks = marks.slice(0, 8).map((m) => ({
      title: m.title,
      percent: Math.round((m.score / m.maxScore) * 100),
      classroom: m.classroom?.name,
      subject: m.subject || m.classroom?.name,
      at: m.createdAt,
    }));

    res.json({
      overview: {
        classrooms: classrooms.length,
        completionRate,
        totalAssignments,
        completedAssignments,
        quizAttempts: attempts.length,
        averageMarkPercent: marks.length
          ? Math.round(marks.reduce((acc, m) => acc + (m.score / m.maxScore) * 100, 0) / marks.length)
          : null,
      },
      subjectWise,
      weeklyProgress: weeks,
      recentMarks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/attendance/:classroomId', async (req, res) => {
  try {
    const c = await assertClassroomAccess(req.user, req.params.classroomId);
    if (!c) return res.status(403).json({ message: 'Forbidden' });

    const sessions = await Attendance.find({ classroom: req.params.classroomId }).sort({ date: 1 }).limit(120);

    if (req.user.role === 'student') {
      let present = 0;
      let absent = 0;
      let late = 0;
      const monthly = {};
      sessions.forEach((doc) => {
        const d = new Date(doc.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key]) monthly[key] = { present: 0, absent: 0, late: 0 };
        const rec = doc.records.find((r) => r.student.equals(req.user._id));
        const st = rec?.status || 'absent';
        if (st === 'present') {
          present += 1;
          monthly[key].present += 1;
        } else if (st === 'late') {
          late += 1;
          monthly[key].late += 1;
        } else {
          absent += 1;
          monthly[key].absent += 1;
        }
      });
      const total = present + absent + late || 1;
      const monthlyChart = Object.entries(monthly).map(([month, v]) => ({
        month,
        present: v.present,
        absent: v.absent,
        late: v.late,
      }));
      return res.json({
        role: 'student',
        summary: { present, absent, late, percent: Math.round((present + late * 0.8) * (100 / total)) },
        pie: [
          { name: 'Present', value: present },
          { name: 'Absent', value: absent },
          { name: 'Late', value: late },
        ],
        monthlyChart,
      });
    }

    const studentIds = c.students.map((s) => s._id || s);
    const perStudent = studentIds.map((sid) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      sessions.forEach((doc) => {
        const rec = doc.records.find((r) => r.student.equals(sid));
        const st = rec?.status || 'absent';
        if (st === 'present') present += 1;
        else if (st === 'late') late += 1;
        else absent += 1;
      });
      const total = present + absent + late || 1;
      const doc = c.students.find((x) => String(x._id || x) === String(sid));
      return {
        studentId: sid,
        name: doc?.name || 'Student',
        percent: Math.round(((present + late * 0.8) / total) * 100),
        present,
        absent,
        late,
      };
    });

    const monthlyAgg = {};
    sessions.forEach((doc) => {
      const d = new Date(doc.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyAgg[key]) monthlyAgg[key] = { present: 0, absent: 0, late: 0 };
      doc.records.forEach((r) => {
        if (r.status === 'present') monthlyAgg[key].present += 1;
        else if (r.status === 'late') monthlyAgg[key].late += 1;
        else monthlyAgg[key].absent += 1;
      });
    });
    const monthlyChart = Object.entries(monthlyAgg).map(([month, v]) => ({ month, ...v }));

    res.json({
      role: 'teacher',
      perStudent,
      monthlyChart,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
