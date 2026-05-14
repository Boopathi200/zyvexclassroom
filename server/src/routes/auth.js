const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

function signToken(id) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const allowed = ['student', 'teacher'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ message: 'Role must be student or teacher' });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences || { theme: 'dark' },
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: err.message || 'Server error',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences || { theme: 'dark' },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: err.message || 'Server error',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

router.get('/me', protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      preferences: req.user.preferences || { theme: 'dark' },
    },
  });
});

module.exports = router;
