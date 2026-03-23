const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Registration = require('../models/Registration');
const GameState = require('../models/GameState');
const Team = require('../models/Team');
const Question = require('../models/Question');
const { adminProtect } = require('../middleware/auth');

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `reg_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png) are allowed'));
  }
});

// POST /api/register
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    const gameState = await GameState.findOne({ singleton: 'main' });
    if (gameState?.registrationsLocked) {
      return res.status(403).json({ error: 'REGISTRATIONS ARE CURRENTLY LOCKED BY THE GHOST LEADER' });
    }

    const {
      teamName,
      p1Name, p1Contact, p1Email, p1College, p1YearBranch,
      p2Name, p2Contact, p2Email, p2College, p2YearBranch,
      paymentMethod, transactionId
    } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Payment screenshot is required' });

    const newRegistration = new Registration({
      teamName,
      participant1: {
        name: p1Name,
        contact: p1Contact,
        email: p1Email,
        college: p1College,
        yearBranch: p1YearBranch
      },
      participant2: {
        name: p2Name,
        contact: p2Contact,
        email: p2Email,
        college: p2College,
        yearBranch: p2YearBranch
      },
      payment: {
        method: paymentMethod,
        transactionId,
        screenshotPath: req.file.path.replace(/\\/g, '/')
      }
    });

    await newRegistration.save();
    res.status(201).json({ success: true, message: 'Registration submitted successfully' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ADMIN ROUTES
router.get('/admin/all', adminProtect, async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 });
    res.json({ registrations: regs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/admin/approve/:id', adminProtect, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    // Generate random credentials
    const teamId = `TEAM-${Math.floor(1000 + Math.random() * 9000)}`;
    const password = Math.random().toString(36).slice(-8);

    // Create Team
    const team = await Team.create({
      teamId,
      teamName: reg.teamName || 'Ghost Team',
      password,
      participants: [
        { name: reg.participant1.name, email: reg.participant1.email },
        { name: reg.participant2.name, email: reg.participant2.email }
      ]
    });

    // Auto-create questions (logic from admin.js)
    const allTeams = await Team.countDocuments();
    const idx = (allTeams - 1) % 8;
    const BINARY_WORDS = ['KALCHAKRA','MAYATRAP','DARKZONE','HEXBREACH','VOIDGATE','SHADOWKEY','CIPHERED','NULLVOID'];
    const PSEUDO_VARS = [{x:7,y:2},{x:9,y:4},{x:6,y:1},{x:8,y:3},{x:12,y:5},{x:10,y:2},{x:7,y:5},{x:11,y:3}];
    const r1Word = BINARY_WORDS[idx];
    const r1Binary = r1Word.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
    const pv = PSEUDO_VARS[idx];
    const r2Ans = (pv.x > 5 && pv.y !== 3) ? (pv.x ^ pv.y).toString() : (pv.x & pv.y).toString();
    const shift = (idx % 5) + 3;
    const cipher = BINARY_WORDS[(idx + 3) % 8].split('').map(c => String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65)).join('');
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

    reg.status = 'approved';
    await reg.save();

    res.json({ success: true, teamId, password });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/reject/:id', adminProtect, async (req, res) => {
  try {
    await Registration.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/admin/toggle-lock', adminProtect, async (req, res) => {
  try {
    const gs = await GameState.findOne({ singleton: 'main' });
    gs.registrationsLocked = !gs.registrationsLocked;
    await gs.save();
    res.json({ success: true, registrationsLocked: gs.registrationsLocked });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
