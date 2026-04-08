const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Create complaint
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, category, village } = req.body;

    const complaint = new Complaint({
      title,
      description,
      category,
      village,
      citizen: req.user.userId
    });

    await complaint.save();

    res.status(201).json({
      message: 'Complaint submitted successfully!',
      complaint
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all complaints (admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('citizen', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ complaints });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my complaints (citizen)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({ complaints });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update complaint status (admin)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      message: 'Status updated successfully!',
      complaint
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;