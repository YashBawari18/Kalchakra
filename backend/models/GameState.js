const mongoose = require('mongoose');

const GameStateSchema = new mongoose.Schema({
  singleton: { type: String, default: 'main', unique: true },
  isRunning: { type: Boolean, default: false },
  gameStartTime: { type: Date },
  roundsGloballyUnlocked: { type: [Number], default: [1] },
  broadcastMessage: { type: String, default: '' },
  labAssistantActive: { type: Boolean, default: false },
  labAssistantQuestion: { type: String },
  labAssistantAnswer: { type: String },
  labAssistantDeadline: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('GameState', GameStateSchema);
