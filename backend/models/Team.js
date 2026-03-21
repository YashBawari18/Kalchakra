const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TeamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  teamName: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  participants: [
    {
      name: { type: String, required: true },
      email: { type: String }
    }
  ],
  score: { type: Number, default: 0 },
  currentRound: { type: Number, default: 1 },
  roundsUnlocked: { type: [Number], default: [1] },
  roundsCompleted: { type: [Number], default: [] },
  roundTimes: {
    round1: { start: Date, end: Date, timeTaken: Number },
    round2: { start: Date, end: Date, timeTaken: Number },
    round3: { start: Date, end: Date, timeTaken: Number }
  },
  penalties: { type: Number, default: 0 },
  penaltyPoints: { type: Number, default: 0 },
  tabSwitches: { type: Number, default: 0 },
  isFrozen: { type: Boolean, default: false },
  freezeUntil: { type: Date },
  sessionToken: { type: String },
  isActive: { type: Boolean, default: true },
  gameStartTime: { type: Date },
  totalTimeTaken: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  r3Stage: { type: Number, default: 0 }
}, { timestamps: true });

TeamSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

TeamSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

TeamSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.sessionToken;
  return obj;
};

module.exports = mongoose.model('Team', TeamSchema);
