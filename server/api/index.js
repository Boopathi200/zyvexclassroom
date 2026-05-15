const express = require('express');
const cors = require('cors');
const demoRoutes = require('../src/demoRoutes');

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'https://zyvexclassroom.vercel.app';
const allowedOrigins = CLIENT_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'Zyvex Classroom API',
    environment: process.env.NODE_ENV || 'production',
    database: process.env.MONGODB_URI ? 'mongodb' : 'demo',
    host: 'vercel',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', demoRoutes);

module.exports = app;
