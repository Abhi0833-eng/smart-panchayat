const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/my', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.userId })
      .populate('complaint', 'title status')
      .sort({ createdAt: -1 })
      .limit(30);
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load notifications.' });
  }
});

router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID.' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    return res.json({ notification });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update notification.' });
  }
});

router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, readAt: null },
      { readAt: new Date() }
    );
    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update notifications.' });
  }
});

module.exports = router;
