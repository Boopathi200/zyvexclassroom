const mongoose = require('mongoose');

const lectureVideoSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: 'General', trim: true },
    description: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LectureVideo', lectureVideoSchema);
