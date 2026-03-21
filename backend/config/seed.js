require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Question = require('../models/Question');
const GameState = require('../models/GameState');

// ─── CONFIGURE YOUR TEAMS HERE ────────────────────────────────────────────────
// Add or remove teams as needed. Each team gets unique puzzles auto-generated.
const TEAMS = [
  {
    teamId: 'TEAM-001',
    teamName: 'Ghost Protocol',
    password: 'ghost2024',
    participants: [
      { name: 'Arjun Sharma', email: 'arjun@example.com' },
      { name: 'Priya Mehta', email: 'priya@example.com' }
    ]
  },
  {
    teamId: 'TEAM-002',
    teamName: 'Shadow Cipher',
    password: 'shadow99',
    participants: [
      { name: 'Rohan Das', email: 'rohan@example.com' },
      { name: 'Sneha Iyer', email: 'sneha@example.com' }
    ]
  },
  {
    teamId: 'TEAM-003',
    teamName: 'Null Sector',
    password: 'null007',
    participants: [
      { name: 'Kiran Patel', email: 'kiran@example.com' },
      { name: 'Ananya Roy', email: 'ananya@example.com' }
    ]
  },
  {
    teamId: 'TEAM-004',
    teamName: 'Void Runner',
    password: 'void404',
    participants: [
      { name: 'Vikram Singh', email: 'vikram@example.com' },
      { name: 'Divya Nair', email: 'divya@example.com' }
    ]
  },
  {
    teamId: 'TEAM-005',
    teamName: 'Dark Matrix',
    password: 'matrix500',
    participants: [
      { name: 'Aditya Kumar', email: 'aditya@example.com' },
      { name: 'Shruti Verma', email: 'shruti@example.com' }
    ]
  },
  {
    teamId: 'TEAM-006',
    teamName: 'Hex Breach',
    password: 'hexbreach1',
    participants: [
      { name: 'Nikhil Joshi', email: 'nikhil@example.com' },
      { name: 'Pooja Reddy', email: 'pooja@example.com' }
    ]
  }
];
// ──────────────────────────────────────────────────────────────────────────────

// Binary word pool - each team gets different words to encode
const BINARY_WORDS = [
  'KALCHAKRA', 'MAYATRAP', 'DARKZONE', 'HEXBREACH',
  'VOIDGATE', 'SHADOWKEY', 'CIPHERED', 'NULLVOID'
];

function textToBinary(text) {
  return text.split('').map(c =>
    c.charCodeAt(0).toString(2).padStart(8, '0')
  ).join(' ');
}

// Pseudocode variable pools
const PSEUDO_VARS = [
  { x: 7, y: 2 },   // 7 XOR 2 = 5
  { x: 9, y: 4 },   // 9 XOR 4 = 13
  { x: 6, y: 1 },   // 6 AND 1 = 0 (else branch)
  { x: 8, y: 3 },   // 8 XOR 3 = 11
  { x: 12, y: 5 },  // 12 XOR 5 = 9
  { x: 10, y: 2 }   // 10 XOR 2 = 8
];

function evalPseudo(x, y) {
  if (x > 5 && y !== 3) return (x ^ y).toString();
  else return (x & y).toString();
}

// Caesar cipher pool
const CIPHER_WORDS = [
  'KALCHAKRA', 'MAYATRAP', 'DARKZONE', 'VOIDGATE',
  'HEXBREACH', 'NULLSECT', 'SHADOWFW', 'CIPHERED'
];

function caesarEncrypt(text, shift) {
  return text.split('').map(c => {
    if (c >= 'A' && c <= 'Z') {
      return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
    }
    return c;
  }).join('');
}

// Round 3 stage pools
const R3_STAGE_POOLS = {
  1: [ // Logic gates
    { q: 'A=1, B=0 → A NAND B = ?', a: '1' },
    { q: 'A=1, B=1 → A NOR B = ?', a: '0' },
    { q: 'A=0, B=0 → A XNOR B = ?', a: '1' },
    { q: 'A=1, B=0 → A XOR B = ?', a: '1' },
    { q: 'A=1, B=1 → A NAND B = ?', a: '0' },
    { q: 'A=0, B=1 → A NOR B = ?', a: '0' }
  ],
  2: [ // Debug code
    { q: 'Fix: print arr[i]  (Python 3)', a: 'print(arr[i])' },
    { q: 'Fix: if x = 5: print("yes")  (Python)', a: 'if x == 5: print("yes")' },
    { q: 'Fix: for i in range(5) print(i)  (missing colon)', a: 'for i in range(5): print(i)' },
    { q: 'Fix: def add(a,b) return a+b  (missing colon)', a: 'def add(a,b): return a+b' },
    { q: 'Fix: x = int(input)  (missing parentheses)', a: 'x = int(input())' },
    { q: 'Fix: list.append(1,2)  (too many args)', a: 'list.append(1)' }
  ],
  3: [ // Decryption (ROT13)
    { q: 'ROT13: "Xnyphunxen" = ?', a: 'Kalchakra' },
    { q: 'ROT13: "Znlngenl" = ?', a: 'Mayatray' },
    { q: 'ROT13: "Inyqngbe" = ?', a: 'Validator' },
    { q: 'ROT13: "Pbqroenxre" = ?', a: 'Codebreaker' },
    { q: 'ROT13: "Funqbjxrl" = ?', a: 'Shadowkey' },
    { q: 'ROT13: "Qnexmbar" = ?', a: 'Darkzone' }
  ],
  4: [ // Pattern
    { q: 'Next: 1, 1, 2, 3, 5, 8, 13, ?', a: '21' },
    { q: 'Next: 2, 4, 8, 16, 32, ?', a: '64' },
    { q: 'Next: 1, 3, 6, 10, 15, ?', a: '21' },
    { q: 'Next: 0, 1, 4, 9, 16, ?', a: '25' },
    { q: 'Next: 1, 2, 6, 24, 120, ?', a: '720' },
    { q: 'Next: 3, 7, 13, 21, 31, ?', a: '43' }
  ]
};

function generateQuestions(teamId, teamIndex) {
  const idx = teamIndex % BINARY_WORDS.length;
  const pseudoVar = PSEUDO_VARS[teamIndex % PSEUDO_VARS.length];
  const cipherWord = CIPHER_WORDS[teamIndex % CIPHER_WORDS.length];
  const cipherShift = (teamIndex % 5) + 3; // shifts 3-7
  const stageIdx = teamIndex % 6;

  // Round 1
  const r1Word = BINARY_WORDS[idx];
  const r1Binary = textToBinary(r1Word);

  // Round 2
  const r2Answer = evalPseudo(pseudoVar.x, pseudoVar.y);
  const r2Cipher = caesarEncrypt(cipherWord, cipherShift);

  // Round 3 - unique stage per team
  const stages = [
    { stageNum: 1, stageName: 'Logic Gates', question: R3_STAGE_POOLS[1][stageIdx].q, answer: R3_STAGE_POOLS[1][stageIdx].a },
    { stageNum: 2, stageName: 'Debug Code', question: R3_STAGE_POOLS[2][stageIdx].q, answer: R3_STAGE_POOLS[2][stageIdx].a },
    { stageNum: 3, stageName: 'Decryption', question: R3_STAGE_POOLS[3][stageIdx].q, answer: R3_STAGE_POOLS[3][stageIdx].a },
    { stageNum: 4, stageName: 'Pattern', question: R3_STAGE_POOLS[4][stageIdx].q, answer: R3_STAGE_POOLS[4][stageIdx].a },
    { stageNum: 5, stageName: 'Final Key', question: `Combine: Gate-answer + first 3 of debug-fix + decrypt-first4 + pattern-ans (format: ANS-FIX-DECRYPT-PATTERN)`, answer: `${R3_STAGE_POOLS[1][stageIdx].a}-${R3_STAGE_POOLS[2][stageIdx].a.split('(')[0].trim()}-${R3_STAGE_POOLS[3][stageIdx].a.slice(0,4)}-${R3_STAGE_POOLS[4][stageIdx].a}` }
  ];

  return {
    round1: {
      binary: r1Binary,
      binaryAnswer: r1Word.toLowerCase()
    },
    round2: {
      pseudoX: pseudoVar.x,
      pseudoY: pseudoVar.y,
      pseudoAnswer: r2Answer,
      cipherText: r2Cipher,
      cipherAnswer: cipherWord.toLowerCase(),
      cipherShift
    },
    round3: stages
  };
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await Team.deleteMany({});
    await Question.deleteMany({});
    await GameState.deleteMany({});
    console.log('✓ Cleared existing data');

    // Seed game state
    await GameState.create({
      singleton: 'main',
      isRunning: false,
      roundsGloballyUnlocked: [1]
    });
    console.log('✓ Game state initialized');

    // Seed teams and questions
    console.log('\n📋 TEAM CREDENTIALS (save these!)\n');
    console.log('━'.repeat(60));

    for (let i = 0; i < TEAMS.length; i++) {
      const teamData = TEAMS[i];
      const rawPassword = teamData.password;

      // Create team
      const team = await Team.create(teamData);

      // Generate unique questions
      const q = generateQuestions(teamData.teamId, i);

      await Question.create({
        teamId: teamData.teamId,
        round: 1,
        questionData: { binary: q.round1.binary, binaryAnswer: q.round1.binaryAnswer }
      });

      await Question.create({
        teamId: teamData.teamId,
        round: 2,
        questionData: {
          pseudoX: q.round2.pseudoX, pseudoY: q.round2.pseudoY,
          pseudoAnswer: q.round2.pseudoAnswer,
          cipherText: q.round2.cipherText, cipherAnswer: q.round2.cipherAnswer,
          cipherShift: q.round2.cipherShift
        }
      });

      await Question.create({
        teamId: teamData.teamId,
        round: 3,
        questionData: { r3Stages: q.round3 }
      });

      console.log(`Team: ${teamData.teamName}`);
      console.log(`  ID:       ${teamData.teamId}`);
      console.log(`  Password: ${rawPassword}`);
      console.log(`  Members:  ${teamData.participants.map(p => p.name).join(', ')}`);
      console.log('─'.repeat(60));
    }

    console.log('\n✓ All teams and questions seeded successfully!');
    console.log('\n🔑 ADMIN LOGIN KEY: ' + process.env.ADMIN_KEY);
    console.log('\nRun: npm run dev  to start the server');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
