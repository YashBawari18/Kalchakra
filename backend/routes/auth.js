const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Team = require('../models/Team');
const GameState = require('../models/GameState');
const { protect } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { teamId, password } = req.body;
    if (!teamId || !password) return res.status(400).json({ error: 'Team ID and password required' });

    const team = await Team.findOne({ teamId: teamId.toUpperCase() });
    if (!team) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await team.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!team.isActive) return res.status(403).json({ error: 'Team account is disabled' });

    // Generate token
    const token = jwt.sign({ teamId: team.teamId }, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Save session token (one device enforcement)
    team.sessionToken = token;
    if (!team.gameStartTime) team.gameStartTime = new Date();
    await team.save();

    // Get game state
    const gameState = await GameState.findOne({ singleton: 'main' });

    // Merge globally unlocked rounds dynamically for the response
    const globalRounds = gameState?.roundsGloballyUnlocked || [];
    const merged = [...new Set([...team.roundsUnlocked, ...globalRounds])];

    res.json({
      success: true,
      token,
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        participants: team.participants,
        score: team.score,
        currentRound: team.currentRound,
        roundsUnlocked: merged,
        roundsCompleted: team.roundsCompleted,
        penalties: team.penalties,
        isFrozen: team.isFrozen,
        freezeUntil: team.freezeUntil,
        r3Stage: team.r3Stage,
        gameStartTime: team.gameStartTime
      },
      gameState: {
        isRunning: gameState?.isRunning || false,
        roundsGloballyUnlocked: gameState?.roundsGloballyUnlocked || [1]
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me - get current team data
router.get('/me', protect, async (req, res) => {
  const gameState = await GameState.findOne({ singleton: 'main' });
  const globalRounds = gameState?.roundsGloballyUnlocked || [];
  const merged = [...new Set([...req.team.roundsUnlocked, ...globalRounds])];

  res.json({
    team: {
      teamId: req.team.teamId,
      teamName: req.team.teamName,
      participants: req.team.participants,
      score: req.team.score,
      currentRound: req.team.currentRound,
      roundsUnlocked: merged,
      roundsCompleted: req.team.roundsCompleted,
      penalties: req.team.penalties,
      isFrozen: req.team.isFrozen,
      freezeUntil: req.team.freezeUntil,
      r3Stage: req.team.r3Stage,
      gameStartTime: req.team.gameStartTime
    },
    gameState: {
      isRunning: gameState?.isRunning || false,
      roundsGloballyUnlocked: gameState?.roundsGloballyUnlocked || [1],
      broadcastMessage: gameState?.broadcastMessage
    }
  });
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  req.team.sessionToken = null;
  await req.team.save();
  res.json({ success: true });
});

module.exports = router;
