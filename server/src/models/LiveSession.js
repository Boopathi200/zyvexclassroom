const mongoose = require('mongoose');
const crypto = require('crypto');

const liveSessionSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
    meetRoomId: { type: String, required: true, unique: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

liveSessionSchema.pre('validate', function generateRoom(next) {
  if (this.meetRoomId) return next();
  this.meetRoomId = `Zyvex-${crypto.randomBytes(10).toString('hex')}`;
  next();
});

module.exports = mongoose.model('LiveSession', liveSessionSchema);
