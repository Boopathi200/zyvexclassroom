const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const LectureVideo = require('../models/LectureVideo');
const Classroom = require('../models/Classroom');
const { protect, requireRole } = require('../middleware/auth');
const { notifyUsers } = require('../utils/notify');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/videos');
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

const videoMime = /^video\//;

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (videoMime.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only video files are allowed'));
  },
});

router.use(protect);

async function canAccess(user, classroomId) {
  const c = await Classroom.findById(classroomId);
  if (!c) return null;
  if (user.role === 'admin') return c;
  if (c.teacher.equals(user._id)) return c;
  if (c.students.some((s) => s.equals(user._id))) return c;
  return null;
}

router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const c = await canAccess(req.user, req.params.classroomId);
    if (!c) return res.status(403).json({ message: 'Forbidden' });
    const videos = await LectureVideo.find({ classroom: req.params.classroomId }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    const { classroomId, title, subject, description } = req.body;
    if (!classroomId || !title || !req.file) {
      return res.status(400).json({ message: 'classroomId, title, and video file required' });
    }
    const c = await Classroom.findById(classroomId);
    if (!c || !c.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    const video = await LectureVideo.create({
      classroom: classroomId,
      title,
      subject: subject || 'General',
      description: description || '',
      fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      createdBy: req.user._id,
    });
    const studentIds = c.students.map((s) => s.toString());
    await notifyUsers(
      studentIds,
      'New lecture video',
      `${title} (${video.subject})`,
      `/dashboard/classrooms/${classroomId}?tab=videos`
    );
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const video = await LectureVideo.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Not found' });
    const c = await Classroom.findById(video.classroom);
    if (!c || !c.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    const clean = (video.fileUrl || '').replace(/^\//, '');
    const abs = path.join(__dirname, '../../', clean);
    if (fs.existsSync(abs)) {
      try {
        fs.unlinkSync(abs);
      } catch {
        /* ignore */
      }
    }
    await video.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
