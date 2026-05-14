const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!n) return res.status(404).json({ message: 'Not found' });
    n.read = true;
    await n.save();
    res.json(n);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
