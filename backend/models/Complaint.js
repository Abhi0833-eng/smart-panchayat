const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    required: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: 550,
    default: ''
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 }
}, { _id: false });

const photoSchema = new mongoose.Schema({
  mimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/webp']
  },
  data: {
    type: String,
    maxlength: 3500000
  }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
  category: {
    type: String,
    enum: ['water', 'road', 'electricity', 'sanitation', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedDepartment: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  dueAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  },
  feedbackHistory: {
    type: [feedbackSchema],
    default: []
  },
  location: {
    type: locationSchema,
    default: null
  },
  photo: {
    type: photoSchema,
    default: null
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  village: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);