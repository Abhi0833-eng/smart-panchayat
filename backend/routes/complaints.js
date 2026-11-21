const express = require('express');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const { verifyToken, requireRole } = require('../middleware/auth');
const { notifyUser, notifyAdmins } = require('../services/notifications');

const router = express.Router();
const statuses = ['pending', 'in-progress', 'resolved'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxPhotoBytes = 2 * 1024 * 1024;

function isValidLocation(location) {
  if (location == null) return true;
  return Number.isFinite(location.latitude)
    && location.latitude >= -90
    && location.latitude <= 90
    && Number.isFinite(location.longitude)
    && location.longitude >= -180
    && location.longitude <= 180;
}

function parsePhoto(photo) {
  if (photo == null) return null;
  if (!photo || !allowedPhotoTypes.includes(photo.mimeType) || typeof photo.data !== 'string') {
    return undefined;
  }

  const data = photo.data.replace(/^data:image\/(?:jpeg|png|webp);base64,/, '');
  if (!data || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return undefined;
  const bytes = Buffer.byteLength(data, 'base64');
  if (bytes > maxPhotoBytes) return undefined;

  return { mimeType: photo.mimeType, data };
}

router.post('/', verifyToken, requireRole('citizen'), async (req, res) => {
  try {
    const { title, description, category, village, location, photo } = req.body;
    if (![title, description, category, village].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Title, description, category and village are required.' });
    }
    if (title.trim().length > 120 || description.trim().length > 3000 || village.trim().length > 100) {
      return res.status(400).json({ message: 'Title, description or village is longer than allowed.' });
    }

    const validCategories = ['water', 'road', 'electricity', 'sanitation', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Choose a valid complaint category.' });
    }
    if (!isValidLocation(location)) {
      return res.status(400).json({ message: 'The location coordinates are invalid.' });
    }

    const parsedPhoto = parsePhoto(photo);
    if (photo && !parsedPhoto) {
      return res.status(400).json({ message: 'Use a JPEG, PNG or WebP photo up to 2 MB.' });
    }

    const complaint = new Complaint({
      title: title.trim(),
      description: description.trim(),
      category,
      village: village.trim(),
      citizen: req.user.userId,
      location: location || null,
      photo: parsedPhoto,
      statusHistory: [{ status: 'pending', note: 'Complaint submitted', changedBy: req.user.userId }]
    });

    await complaint.save();
    const emailStatus = await notifyUser(
      req.user.userId,
      complaint._id,
      'submitted',
      `Your complaint "${complaint.title}" was received.`
    );
    const adminEmailStatus = await notifyAdmins(
      complaint._id,
      'submitted',
      `New complaint from ${complaint.village}: "${complaint.title}".`
    );

    return res.status(201).json({ message: 'Complaint submitted successfully.', complaint, emailStatus, adminEmailStatus });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to submit the complaint.' });
  }
});

router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('citizen', 'name email phone')
      .populate('statusHistory.changedBy', 'name role')
      .sort({ createdAt: -1 });
    return res.json({ complaints });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load complaints.' });
  }
});

router.get('/my', verifyToken, requireRole('citizen'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user.userId })
      .populate('statusHistory.changedBy', 'name role')
      .sort({ createdAt: -1 });
    return res.json({ complaints });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load your complaints.' });
  }
});

router.put('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID.' });
    }
    const { status, note = '' } = req.body;
    if (!statuses.includes(status)) {
      return res.status(400).json({ message: 'Choose a valid complaint status.' });
    }
    if (typeof note !== 'string' || note.length > 500) {
      return res.status(400).json({ message: 'The update note must be 500 characters or fewer.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    let emailStatus = 'not-sent';
    if (complaint.status !== status) {
      complaint.status = status;
      complaint.statusHistory.push({
        status,
        note: note.trim(),
        changedBy: req.user.userId
      });
      complaint.resolvedAt = status === 'resolved' ? new Date() : null;
      await complaint.save();
      emailStatus = await notifyUser(
        complaint.citizen,
        complaint._id,
        'status',
        `Your complaint "${complaint.title}" is now ${status.replace('-', ' ')}.${note.trim() ? ` ${note.trim().slice(0, 120)}` : ''}`
      );
    }

    await complaint.populate('citizen', 'name email phone');
    await complaint.populate('statusHistory.changedBy', 'name role');
    return res.json({ message: 'Complaint status updated.', complaint, emailStatus });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update complaint status.' });
  }
});

router.put('/:id/assignment', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID.' });
    }
    const { assignedDepartment, priority, dueAt } = req.body;
    if (typeof assignedDepartment !== 'string' || assignedDepartment.trim().length > 100) {
      return res.status(400).json({ message: 'Enter a valid department.' });
    }
    if (!priorities.includes(priority)) {
      return res.status(400).json({ message: 'Choose a valid priority.' });
    }
    const dueDate = dueAt ? new Date(dueAt) : null;
    if (dueAt && Number.isNaN(dueDate.getTime())) {
      return res.status(400).json({ message: 'Enter a valid target date.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const wasChanged = complaint.assignedDepartment !== assignedDepartment.trim()
      || complaint.priority !== priority
      || String(complaint.dueAt || '') !== String(dueDate || '');
    complaint.assignedDepartment = assignedDepartment.trim();
    complaint.priority = priority;
    complaint.dueAt = dueDate;
    await complaint.save();

    let emailStatus = 'not-sent';
    if (wasChanged) {
      const details = [
        complaint.assignedDepartment ? `assigned to ${complaint.assignedDepartment}` : 'assignment updated',
        `priority ${priority}`,
        dueDate ? `target date ${dueDate.toLocaleDateString('en-IN')}` : ''
      ].filter(Boolean).join(', ');
      emailStatus = await notifyUser(
        complaint.citizen,
        complaint._id,
        'assignment',
        `Your complaint "${complaint.title}" was ${details}.`.slice(0, 280)
      );
    }

    await complaint.populate('citizen', 'name email phone');
    await complaint.populate('statusHistory.changedBy', 'name role');
    return res.json({ message: 'Complaint assignment saved.', complaint, emailStatus });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to save complaint assignment.' });
  }
});

router.post('/:id/feedback', verifyToken, requireRole('citizen'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID.' });
    }
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 1000) {
      return res.status(400).json({ message: 'Choose a 1–5 rating and keep feedback under 1,000 characters.' });
    }

    const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user.userId });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (complaint.status !== 'resolved') {
      return res.status(409).json({ message: 'Feedback is available after a complaint is resolved.' });
    }

    const lastFeedback = complaint.feedbackHistory[complaint.feedbackHistory.length - 1];
    if (lastFeedback && complaint.resolvedAt && lastFeedback.submittedAt >= complaint.resolvedAt) {
      return res.status(409).json({ message: 'Feedback has already been submitted for this resolution.' });
    }

    complaint.feedbackHistory.push({ rating, comment });
    await complaint.save();
    const adminEmailStatus = await notifyAdmins(
      complaint._id,
      'feedback',
      `Citizen rated "${complaint.title}" ${rating} out of 5 stars${comment ? `: ${comment.slice(0, 100)}` : '.'}`
    );
    return res.json({ message: 'Thank you for your feedback.', complaint, adminEmailStatus });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to save feedback.' });
  }
});

router.post('/:id/reopen', verifyToken, requireRole('citizen'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID.' });
    }
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason || reason.length > 500) {
      return res.status(400).json({ message: 'Explain why the issue is not resolved (500 characters or fewer).' });
    }

    const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user.userId });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (complaint.status !== 'resolved') {
      return res.status(409).json({ message: 'Only resolved complaints can be reopened.' });
    }

    complaint.status = 'pending';
    complaint.resolvedAt = null;
    complaint.statusHistory.push({
      status: 'pending',
      note: `Reopened by citizen: ${reason}`,
      changedBy: req.user.userId
    });
    await complaint.save();

    const adminEmailStatus = await notifyAdmins(
      complaint._id,
      'reopened',
      `Complaint "${complaint.title}" was reopened: ${reason.slice(0, 100)}`
    );

    await complaint.populate('statusHistory.changedBy', 'name role');
    return res.json({ message: 'Complaint reopened for review.', complaint, adminEmailStatus });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reopen complaint.' });
  }
});

module.exports = router;
