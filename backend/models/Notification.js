const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  type: {
    type: String,
    enum: ['submitted', 'status', 'assignment', 'reopened', 'feedback'],
    required: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
