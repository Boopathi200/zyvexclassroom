const mongoose = require('mongoose');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    code: { type: String, required: true, unique: true, uppercase: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

classroomSchema.pre('validate', async function ensureUniqueCode(next) {
  if (this.code) return next();
  const Classroom = this.constructor;
  let code = generateCode();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Classroom.findOne({ code });
    if (!exists) {
      this.code = code;
      return next();
    }
    code = generateCode();
  }
  return next(new Error('Could not generate unique classroom code'));
});

module.exports = mongoose.model('Classroom', classroomSchema);
