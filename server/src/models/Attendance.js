const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    date: { type: Date, required: true },
    topic: { type: String, default: '' },
    records: [recordSchema],
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ classroom: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
