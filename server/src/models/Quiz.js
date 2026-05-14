const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    timeLimitMinutes: { type: Number, default: 30, min: 1 },
    questions: { type: [questionSchema], required: true, validate: [(q) => q.length > 0, 'At least one question'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
