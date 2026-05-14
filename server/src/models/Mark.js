const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, default: '', trim: true },
    title: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mark', markSchema);
