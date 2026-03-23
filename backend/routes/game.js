const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const GameState = require('../models/GameState');
const { protect } = require('../middleware/auth');

// GET /api/game/question/:round  - get team's question for a round
router.get('/question/:round', protect, async (req, res) => {
  try {
    const round = parseInt(req.params.round);
    const team = req.team;

    // Check if round is accessible
    if (!team.roundsUnlocked.includes(round)) {
      const gs = await GameState.findOne({ singleton: 'main' });
      if (!gs?.roundsGloballyUnlocked.includes(round)) {
        return res.status(403).json({ error: 'Round not unlocked yet' });
      }
    }

    const q = await Question.findOne({ teamId: team.teamId, round });
    if (!q) return res.status(404).json({ error: 'Question not found' });

    // Don't send answers to client
    const safe = { teamId: q.teamId, round: q.round };

    if (round === 1) {
      safe.binary = q.questionData.binary;
      safe.hint = 'Convert each 8-bit binary group to its ASCII character.';
    } else if (round === 2) {
      safe.pseudoX = q.questionData.pseudoX;
      safe.pseudoY = q.questionData.pseudoY;
      safe.cipherText = q.questionData.cipherText;
      safe.cipherShift = q.questionData.cipherShift;
      safe.hint = 'Part 1: Evaluate the pseudocode logic. Part 2: Decode using Caesar cipher (reverse the shift).';
      safe.pseudoCode = `IF (x > 5 AND y != 3):\n  RETURN x XOR y\nELSE:\n  RETURN x AND y\n// x=${q.questionData.pseudoX}, y=${q.questionData.pseudoY}`;
    } else if (round === 3) {
      const stages = q.questionData.r3Stages.map(s => ({
        stageNum: s.stageNum,
        stageName: s.stageName,
        question: s.question
      }));
      safe.stages = stages;
      safe.currentStage = team.r3Stage;
    }

    // Set round start time
    const roundKey = `round${round}`;
    if (!team.roundTimes[roundKey]?.start) {
      team.roundTimes[roundKey] = { start: new Date() };
      await team.save();
    }

    res.json({ question: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/game/submit/:round
router.post('/submit/:round', protect, async (req, res) => {
  try {
    const round = parseInt(req.params.round);
    const team = req.team;
    const { answer, answer2, stageNum } = req.body;
    const io = req.app.get('io');

    // Prevent re-submission
    if (team.roundsCompleted.includes(round) && round !== 3) {
      return res.status(400).json({ error: 'Round already completed' });
    }

    const q = await Question.findOne({ teamId: team.teamId, round });
    if (!q) return res.status(404).json({ error: 'Question not found' });

    let isCorrect = false;
    let pointsAwarded = 0;
    let timeTaken = 0;

    const roundKey = `round${round}`;
    const startTime = team.roundTimes[roundKey]?.start || team.gameStartTime || new Date();
    timeTaken = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);

    if (round === 1) {
      isCorrect = answer?.toLowerCase().trim() === q.questionData.binaryAnswer.toLowerCase();
      if (isCorrect) {
        pointsAwarded = Math.max(500, 5000 - timeTaken * 2);
      }
    } else if (round === 2) {
      const a1 = answer?.toString().trim() === q.questionData.pseudoAnswer;
      const a2 = answer2?.toLowerCase().trim() === q.questionData.cipherAnswer.toLowerCase();
      isCorrect = a1 && a2;
      if (!a1 && !a2) return res.status(400).json({ error: 'INCORRECT — Both answers wrong.', isCorrect: false });
      if (!a1) return res.status(400).json({ error: 'INCORRECT — Pseudocode answer wrong.', isCorrect: false });
      if (!a2) return res.status(400).json({ error: 'INCORRECT — Cipher answer wrong.', isCorrect: false });
      if (isCorrect) pointsAwarded = Math.max(1000, 8000 - timeTaken * 2);
    } else if (round === 3) {
      const stage = q.questionData.r3Stages.find(s => s.stageNum === stageNum);
      if (!stage) return res.status(400).json({ error: 'Invalid stage' });
      if (stageNum !== team.r3Stage + 1) return res.status(400).json({ error: 'Complete previous stages first' });

      isCorrect = answer?.toLowerCase().trim() === stage.answer.toLowerCase().trim();
      if (isCorrect) {
        team.r3Stage = stageNum;
        pointsAwarded = Math.max(500, 3000 - timeTaken * 1);
        if (stageNum === 5) {
          // Final stage - complete round
          team.roundsCompleted.push(3);
          team.roundTimes.round3.end = new Date();
          team.roundTimes.round3.timeTaken = timeTaken;
        }
        await team.save();

        await Submission.create({ teamId: team.teamId, round, answer, isCorrect, timeTaken, pointsAwarded });
        team.score += pointsAwarded;
        await team.save();

        if (io) io.emit('leaderboard_update', await getLeaderboard());
        return res.json({ isCorrect: true, pointsAwarded, r3Stage: team.r3Stage, roundComplete: stageNum === 5 });
      } else {
        await Submission.create({ teamId: team.teamId, round, answer, isCorrect: false, timeTaken, pointsAwarded: 0 });
        return res.json({ isCorrect: false, message: 'Incorrect — try again.' });
      }
    }

    // Save submission
    await Submission.create({ teamId: team.teamId, round, answer: { answer, answer2 }, isCorrect, timeTaken, pointsAwarded });

    if (isCorrect) {
      team.score += pointsAwarded;
      team.roundsCompleted.push(round);
      team.roundTimes[roundKey].end = new Date();
      team.roundTimes[roundKey].timeTaken = timeTaken;

      // Unlock next round check (admin still must unlock globally)
      if (round === 1) team.currentRound = Math.max(team.currentRound, 2);
      if (round === 2) team.currentRound = Math.max(team.currentRound, 3);
      if (round === 3) team.currentRound = 3;

      await team.save();
      if (io) io.emit('leaderboard_update', await getLeaderboard());

      res.json({ isCorrect: true, pointsAwarded, score: team.score, timeTaken, roundComplete: true });
    } else {
      res.json({ isCorrect: false, message: 'Incorrect — try again.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/game/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    res.json({ leaderboard: await getLeaderboard() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

async function getLeaderboard() {
  const teams = await Team.find({ isActive: true })
    .select('teamId teamName score currentRound roundsCompleted totalTimeTaken')
    .sort({ score: -1, totalTimeTaken: 1 });

  return teams.map((t, i) => ({
    rank: i + 1,
    teamId: t.teamId,
    teamName: t.teamName,
    score: t.score,
    currentRound: t.currentRound,
    roundsCompleted: t.roundsCompleted
  }));
}

// POST /api/game/penalty  (tab switch penalty)
router.post('/penalty', protect, async (req, res) => {
  try {
    const { type } = req.body;
    const team = req.team;
    const io = req.app.get('io');

    if (type === 'tab_switch') {
      team.tabSwitches += 1;
      team.penalties += 1;
      const deduction = 200;
      team.score = Math.max(0, team.score - deduction);
      team.penaltyPoints += deduction;
      await team.save();
      if (io) {
        io.emit('leaderboard_update', await getLeaderboard());
        io.to('admin_room').emit('admin_log', `[ANTI-CHEAT] ${team.teamName} (${team.teamId}) switched tabs! -200 pts.`);
      }
      res.json({ score: team.score, deduction, tabSwitches: team.tabSwitches });
    } else {
      res.status(400).json({ error: 'Unknown penalty type' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
module.exports.getLeaderboard = getLeaderboard;
