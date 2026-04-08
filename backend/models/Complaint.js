const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
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
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  village: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);