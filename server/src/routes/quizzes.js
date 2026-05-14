const express = require('express');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Classroom = require('../models/Classroom');
const { protect, requireRole } = require('../middleware/auth');
const { notifyUsers } = require('../utils/notify');

const router = express.Router();

router.use(protect);

async function canAccessClassroom(user, classroomId) {
  const c = await Classroom.findById(classroomId);
  if (!c) return null;
  if (user.role === 'admin') return c;
  if (c.teacher.equals(user._id)) return c;
  if (c.students.some((s) => s.equals(user._id))) return c;
  return null;
}

function stripAnswers(quizDoc) {
  const o = quizDoc.toObject();
  o.questions = o.questions.map((q) => ({
    text: q.text,
    options: q.options,
  }));
  return o;
}

router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const c = await canAccessClassroom(req.user, req.params.classroomId);
    if (!c) return res.status(403).json({ message: 'Forbidden' });
    const quizzes = await Quiz.find({ classroom: req.params.classroomId }).sort({ createdAt: -1 });
    if (req.user.role === 'student') {
      const attempts = await QuizAttempt.find({
        student: req.user._id,
        quiz: { $in: quizzes.map((q) => q._id) },
      });
      const map = Object.fromEntries(attempts.map((a) => [String(a.quiz), a]));
      const out = quizzes.map((q) => ({
        ...stripAnswers(q),
        myAttempt: map[String(q._id)] || null,
      }));
      return res.json(out);
    }
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Not found' });
    const c = await canAccessClassroom(req.user, quiz.classroom);
    if (!c) return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'student') {
      const attempt = await QuizAttempt.findOne({ quiz: quiz._id, student: req.user._id });
      if (attempt) {
        return res.json({ ...stripAnswers(quiz), submitted: true, attempt });
      }
      return res.json({ ...stripAnswers(quiz), submitted: false });
    }
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId, title, description, timeLimitMinutes, questions } = req.body;
    if (!classroomId || !title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'classroomId, title, and questions[] required' });
    }
    const c = await Classroom.findById(classroomId);
    if (!c || !c.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only class teacher can create quizzes' });
    }
    const cleaned = questions.map((q) => ({
      text: q.text,
      options: q.options,
      correctIndex: Number(q.correctIndex),
    }));
    const quiz = await Quiz.create({
      classroom: classroomId,
      title,
      description: description || '',
      timeLimitMinutes: timeLimitMinutes || 30,
      questions: cleaned,
      createdBy: req.user._id,
    });
    const studentIds = c.students.map((s) => s.toString());
    await notifyUsers(
      studentIds,
      'New quiz',
      `${title} in ${c.name}`,
      `/dashboard/classrooms/${classroomId}?tab=quizzes`
    );
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/submit', requireRole('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const c = await canAccessClassroom(req.user, quiz.classroom);
    if (!c) return res.status(403).json({ message: 'Forbidden' });
    const existing = await QuizAttempt.findOne({ quiz: quiz._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already submitted' });
    const answers = (req.body.answers || []).map((a) => Number(a));
    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Answer every question' });
    }
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score += 1;
    });
    const maxScore = quiz.questions.length;
    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      answers,
      score,
      maxScore,
    });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Not found' });
    const c = await Classroom.findById(quiz.classroom);
    if (!c || !c.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
