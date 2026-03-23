const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  college: { type: String, required: true, trim: true },
  yearBranch: { type: String, required: true, trim: true }
});

const RegistrationSchema = new mongoose.Schema({
  teamName: { type: String, trim: true },
  participant1: { type: ParticipantSchema, required: true },
  participant2: { type: ParticipantSchema, required: true },
  payment: {
    method: { type: String, enum: ['UPI', 'Cash', 'Other'], required: true },
    transactionId: { type: String, required: true, trim: true },
    screenshotPath: { type: String, required: true }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
