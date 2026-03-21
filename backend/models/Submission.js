const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  teamId: { type: String, required: true, uppercase: true },
  round: { type: Number, required: true },
  answer: { type: mongoose.Schema.Types.Mixed },
  isCorrect: { type: Boolean, required: true },
  timeTaken: { type: Number },
  pointsAwarded: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
