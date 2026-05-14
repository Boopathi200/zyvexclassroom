require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { connectDb } = require('./db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const classroomRoutes = require('./routes/classrooms');
const assignmentRoutes = require('./routes/assignments');
const quizRoutes = require('./routes/quizzes');
const attendanceRoutes = require('./routes/attendance');
const markRoutes = require('./routes/marks');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const liveSessionRoutes = require('./routes/liveSessions');
const videoRoutes = require('./routes/videos');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-classroom', (classroomId) => {
    if (typeof classroomId === 'string' && classroomId.length > 0 && classroomId.length < 80) {
      socket.join(`classroom:${classroomId}`);
    }
  });
  socket.on('leave-classroom', (classroomId) => {
    if (typeof classroomId === 'string') socket.leave(`classroom:${classroomId}`);
  });
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'Zyvex Classroom API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

connectDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Zyvex Classroom server on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
