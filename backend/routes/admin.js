const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const GameState = require('../models/GameState');
const { adminProtect } = require('../middleware/auth');
const { getLeaderboard } = require('./game');

// All admin routes require admin key
router.use(adminProtect);

// GET /api/admin/teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find({}).select('-password -sessionToken').sort({ score: -1 });
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/teams  - create a new team
router.post('/teams', async (req, res) => {
  try {
    const { teamId, teamName, password, participants } = req.body;
    const io = req.app.get('io');

    const existing = await Team.findOne({ teamId: teamId.toUpperCase() });
    if (existing) return res.status(400).json({ error: 'Team ID already exists' });

    const team = await Team.create({ teamId: teamId.toUpperCase(), teamName, password, participants: participants || [] });

    // Auto-create default questions (index based on team count)
    const allTeams = await Team.countDocuments();
    const idx = (allTeams - 1) % 8;

    const BINARY_WORDS = ['KALCHAKRA','MAYATRAP','DARKZONE','HEXBREACH','VOIDGATE','SHADOWKEY','CIPHERED','NULLVOID'];
    const PSEUDO_VARS = [{x:7,y:2},{x:9,y:4},{x:6,y:1},{x:8,y:3},{x:12,y:5},{x:10,y:2},{x:7,y:5},{x:11,y:3}];

    const r1Word = BINARY_WORDS[idx];
    const r1Binary = r1Word.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
    const pv = PSEUDO_VARS[idx];
    const r2Ans = (pv.x > 5 && pv.y !== 3) ? (pv.x ^ pv.y).toString() : (pv.x & pv.y).toString();
    const shift = (idx % 5) + 3;
    const cipher = BINARY_WORDS[(idx + 3) % 8].split('').map(c =>
      String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65)
    ).join('');
    const cipherAnswer = BINARY_WORDS[(idx + 3) % 8];

    await Question.create({ teamId: team.teamId, round: 1, questionData: { binary: r1Binary, binaryAnswer: r1Word.toLowerCase() } });
    await Question.create({ teamId: team.teamId, round: 2, questionData: { pseudoX: pv.x, pseudoY: pv.y, pseudoAnswer: r2Ans, cipherText: cipher, cipherAnswer: cipherAnswer.toLowerCase(), cipherShift: shift } });
    await Question.create({ teamId: team.teamId, round: 3, questionData: { r3Stages: [
      {stageNum:1,stageName:'Logic Gates',question:'A=1, B=0 → A NAND B = ?',answer:'1'},
      {stageNum:2,stageName:'Debug Code',question:'Fix: print arr[i]  (Python 3)',answer:'print(arr[i])'},
      {stageNum:3,stageName:'Decryption',question:'ROT13: "Xnyphunxen" = ?',answer:'Kalchakra'},
      {stageNum:4,stageName:'Pattern',question:'Next: 1, 1, 2, 3, 5, 8, 13, ?',answer:'21'},
      {stageNum:5,stageName:'Final Key',question:'Combine stage answers (format: 1-print-Kal-21)',answer:'1-print-Kal-21'}
    ]}});

    if (io) io.emit('team_created', { teamId: team.teamId, teamName: team.teamName });
    res.json({ success: true, team: { teamId: team.teamId, teamName, participants } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/gamestate
router.get('/gamestate', async (req, res) => {
  try {
    const gs = await GameState.findOne({ singleton: 'main' });
    res.json({ gameState: gs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/game/start
router.post('/game/start', async (req, res) => {
  try {
    const io = req.app.get('io');
    await GameState.findOneAndUpdate({ singleton: 'main' }, { isRunning: true, gameStartTime: new Date() }, { upsert: true });
    await Team.updateMany({}, { gameStartTime: new Date() });
    if (io) io.emit('game_started', { startTime: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/game/stop
router.post('/game/stop', async (req, res) => {
  try {
    const io = req.app.get('io');
    await GameState.findOneAndUpdate({ singleton: 'main' }, { isRunning: false });
    if (io) io.emit('game_stopped');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/unlock-round
router.post('/unlock-round', async (req, res) => {
  try {
    const { round } = req.body;
    const io = req.app.get('io');

    await GameState.findOneAndUpdate(
      { singleton: 'main' },
      { $addToSet: { roundsGloballyUnlocked: round } },
      { upsert: true }
    );

    // Also update all teams
    await Team.updateMany({}, { $addToSet: { roundsUnlocked: round } });

    if (io) io.emit('round_unlocked', { round });
    res.json({ success: true, round });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/freeze
router.post('/freeze', async (req, res) => {
  try {
    const { teamId, seconds } = req.body;
    const io = req.app.get('io');
    const freezeUntil = new Date(Date.now() + (seconds || 15) * 1000);

    await Team.findOneAndUpdate({ teamId: teamId.toUpperCase() }, { isFrozen: true, freezeUntil });

    if (io) {
      io.to(`team_${teamId.toUpperCase()}`).emit('freeze', { seconds: seconds || 15 });
    }

    // Auto-unfreeze
    setTimeout(async () => {
      await Team.findOneAndUpdate({ teamId: teamId.toUpperCase() }, { isFrozen: false });
    }, (seconds || 15) * 1000);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/penalty
router.post('/penalty', async (req, res) => {
  try {
    const { teamId, points, reason } = req.body;
    const io = req.app.get('io');
    const team = await Team.findOne({ teamId: teamId.toUpperCase() });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    team.score = Math.max(0, team.score - (points || 500));
    team.penalties += 1;
    team.penaltyPoints += (points || 500);
    await team.save();

    if (io) {
      io.to(`team_${teamId.toUpperCase()}`).emit('penalty', { points, reason });
      io.emit('leaderboard_update', await getLeaderboard());
    }
    res.json({ success: true, newScore: team.score });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/broadcast
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    const io = req.app.get('io');
    await GameState.findOneAndUpdate({ singleton: 'main' }, { broadcastMessage: message });
    if (io) io.emit('broadcast', { message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/lab-assistant
router.post('/lab-assistant', async (req, res) => {
  try {
    const { question, answer, seconds } = req.body;
    const io = req.app.get('io');
    const deadline = new Date(Date.now() + (seconds || 30) * 1000);
    await GameState.findOneAndUpdate({ singleton: 'main' }, { labAssistantActive: true, labAssistantQuestion: question, labAssistantAnswer: answer, labAssistantDeadline: deadline });
    if (io) io.emit('lab_assistant', { question, deadline, seconds: seconds || 30 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    res.json({ leaderboard: await getLeaderboard() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/submissions/:teamId
router.get('/submissions/:teamId', async (req, res) => {
  try {
    const subs = await Submission.find({ teamId: req.params.teamId.toUpperCase() }).sort({ submittedAt: -1 });
    res.json({ submissions: subs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/reset
router.delete('/reset', async (req, res) => {
  try {
    await Team.updateMany({}, {
      score: 0, currentRound: 1, roundsCompleted: [], roundsUnlocked: [1],
      penalties: 0, penaltyPoints: 0, tabSwitches: 0, isFrozen: false,
      sessionToken: null, gameStartTime: null, r3Stage: 0,
      roundTimes: {}
    });
    await Submission.deleteMany({});
    await GameState.findOneAndUpdate({ singleton: 'main' }, { isRunning: false, roundsGloballyUnlocked: [1], broadcastMessage: '' });
    res.json({ success: true, message: 'Game reset complete' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
