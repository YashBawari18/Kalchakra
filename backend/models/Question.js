const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  teamId: { type: String, required: true, uppercase: true },
  round: { type: Number, required: true },
  questionData: {
    // Round 1 - Binary
    binary: { type: String },
    binaryAnswer: { type: String },

    // Round 2 - Logic + Cipher
    pseudoX: { type: Number },
    pseudoY: { type: Number },
    pseudoAnswer: { type: String },
    cipherText: { type: String },
    cipherAnswer: { type: String },
    cipherShift: { type: Number },

    // Round 3 - Stage answers
    r3Stages: [
      {
        stageNum: Number,
        stageName: String,
        question: String,
        answer: String
      }
    ]
  }
}, { timestamps: true });

QuestionSchema.index({ teamId: 1, round: 1 }, { unique: true });

module.exports = mongoose.model('Question', QuestionSchema);
