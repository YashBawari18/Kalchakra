# ☠ KALCHAKRA: A Maya Trap
### Full-Stack Multiplayer Tech Escape Game

---

## 🗂 Project Structure

```
kalchakra/
├── backend/           ← Node.js + Express + Socket.io
│   ├── server.js
│   ├── .env
│   ├── config/seed.js        ← RUN THIS to create teams
│   ├── models/
│   │   ├── Team.js
│   │   ├── Question.js
│   │   ├── Submission.js
│   │   └── GameState.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── game.js
│   │   └── admin.js
│   └── middleware/auth.js
│
└── frontend/          ← React.js
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── api.js
        ├── context/
        │   ├── AuthContext.js
        │   └── SocketContext.js
        ├── pages/
        │   ├── Login.js
        │   ├── Dashboard.js
        │   └── AdminPanel.js
        └── components/
            ├── Navbar.js
            ├── AlertModal.js
            ├── FreezeOverlay.js
            ├── Leaderboard.js
            ├── Round1.js
            ├── Round2.js
            └── Round3.js
```

---

## ⚙️ Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

---

## 🚀 Setup Instructions

### Step 1 — Clone / Extract the project

```bash
cd kalchakra
```

---

### Step 2 — Configure Backend

```bash
cd backend
```

Edit `.env`:
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/kalchakra
JWT_SECRET=kalchakra_super_secret_2024_maya_trap
ADMIN_KEY=KALCHAKRA-ADMIN-2024
CLIENT_URL=http://localhost:3000
```

> For MongoDB Atlas, replace MONGODB_URI with your Atlas connection string.

Install dependencies:
```bash
npm install
```

---

### Step 3 — Add / Configure Teams

Open `backend/config/seed.js` and edit the TEAMS array at the top:

```js
const TEAMS = [
  {
    teamId: 'TEAM-001',        // Unique ID — teams use this to login
    teamName: 'Ghost Protocol',
    password: 'ghost2024',     // Plain text — gets hashed automatically
    participants: [
      { name: 'Arjun Sharma', email: 'arjun@example.com' },
      { name: 'Priya Mehta',  email: 'priya@example.com' }
    ]
  },
  {
    teamId: 'TEAM-002',
    teamName: 'Shadow Cipher',
    password: 'shadow99',
    participants: [
      { name: 'Rohan Das' },
      { name: 'Sneha Iyer' }
    ]
  },
  // Add as many teams as needed...
];
```

Each team automatically gets:
- Unique binary puzzle (different word to decode)
- Unique pseudocode variables
- Unique Caesar cipher text
- Unique Round 3 stage questions

---

### Step 4 — Seed the Database

```bash
npm run seed
```

This will print all team credentials to the console:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Team: Ghost Protocol
  ID:       TEAM-001
  Password: ghost2024
  Members:  Arjun Sharma, Priya Mehta
──────────────────────────────────────────────────────────────
...
🔑 ADMIN LOGIN KEY: KALCHAKRA-ADMIN-2024
```

Share each team's ID + password with the respective team before the game.

---

### Step 5 — Start the Backend

```bash
npm run dev      # development (with auto-reload)
# or
npm start        # production
```

Backend runs on: `http://localhost:5001`

---

### Step 6 — Setup Frontend

```bash
cd ../frontend
npm install
```

Edit `frontend/.env` if needed:
```
REACT_APP_API_URL=http://localhost:5001
REACT_APP_SOCKET_URL=http://localhost:5001
```

Start the frontend:
```bash
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🎮 How to Run the Game

### Before the Event:
1. Add all teams to `seed.js`
2. Run `npm run seed`
3. Distribute login credentials to each team privately
4. Start backend and frontend servers

### During the Game (Admin):
1. Go to `http://localhost:3000`
2. Select **ADMIN** tab, enter admin key
3. Click **START GAME** to begin
4. **Unlock Round 2** when you want teams to proceed
5. **Unlock Round 3** when ready for the final
6. Use **FREEZE**, **-500 penalty**, and **BROADCAST** as needed

### Teams:
1. Go to `http://localhost:3000`
2. Enter their **Team ID** and **Password**
3. Complete Round 1 → wait for Round 2 unlock → complete Round 2 → wait for Round 3 unlock → complete all 5 stages

---

## 🔢 Scoring System

| Event | Points |
|-------|--------|
| Round 1 correct | 5000 − (seconds × 2), min 500 |
| Round 2 correct | 8000 − (seconds × 2), min 1000 |
| Round 3 per stage | 3000 − (seconds × 1), min 500 |
| Tab switch penalty | −200 pts |
| Admin penalty | −500 pts (configurable) |

Faster completion = more points. Leaderboard updates in real-time.

---

## 🔐 Anti-Cheat Features

- **One session per team** — logging in on a second device invalidates the first session
- **Tab switch detection** — −200 points per switch, logged to admin
- **Right-click disabled** — no inspect element via right-click
- **Copy/paste disabled** — prevents sharing answers
- **Admin freeze** — admin can freeze any team's screen for N seconds
- **Unique questions** — each team gets different binary/cipher/pseudocode puzzles

---

## 📡 Real-Time Events (Socket.io)

| Event | Direction | Effect |
|-------|-----------|--------|
| `round_unlocked` | Server → All | Teams see round unlock |
| `freeze` | Server → Team | Team screen freezes |
| `penalty` | Server → Team | Points deducted, alert shown |
| `broadcast` | Server → All | Alert popup on all dashboards |
| `lab_assistant` | Server → All | Interrupt puzzle popup |
| `leaderboard_update` | Server → All | Live leaderboard refresh |
| `game_started` | Server → All | Game begins |

---

## 🌐 Deployment (Production)

### Backend (e.g. Railway / Render / VPS):
```bash
npm start
```
Set environment variables on your host.

### Frontend (e.g. Vercel / Netlify):
```bash
npm run build
```
Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to your backend URL.

Update `backend/.env`:
```
CLIENT_URL=https://your-frontend.vercel.app
```

---

## 🔑 Default Credentials

| Role | Login | Key |
|------|-------|-----|
| Admin | Select ADMIN tab | `KALCHAKRA-ADMIN-2024` |
| Team (after seed) | Select TEAM tab | Team ID + Password |

---

## 📝 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Team login |
| GET | `/api/auth/me` | Get current team data |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/game/question/:round` | Get team's question |
| POST | `/api/game/submit/:round` | Submit answer |
| GET | `/api/game/leaderboard` | Public leaderboard |
| POST | `/api/game/penalty` | Report tab switch |
| GET | `/api/admin/teams` | All teams (admin) |
| POST | `/api/admin/teams` | Create team (admin) |
| POST | `/api/admin/game/start` | Start game |
| POST | `/api/admin/game/stop` | Stop game |
| POST | `/api/admin/unlock-round` | Unlock round for all |
| POST | `/api/admin/freeze` | Freeze a team |
| POST | `/api/admin/penalty` | Apply penalty |
| POST | `/api/admin/broadcast` | Broadcast message |
| POST | `/api/admin/lab-assistant` | Trigger interrupt |
| DELETE | `/api/admin/reset` | Reset all game data |

---

## ❓ FAQ

**Q: How do I add more teams?**
Edit the TEAMS array in `backend/config/seed.js` and run `npm run seed` again (this resets all data).

**Q: Can I add a team mid-game without resetting?**
Yes! Go to Admin Panel → Teams tab → Create New Team. It won't reset existing data.

**Q: How do I change the questions?**
Edit the question pools in `backend/config/seed.js` (BINARY_WORDS, R3_STAGE_POOLS, etc.) then re-seed.

**Q: What if teams are on mobile?**
The UI is fully responsive. Teams can play on any device.

**Q: How do I deploy to multiple computers on the same network?**
Set `REACT_APP_API_URL` to your machine's local IP: `http://192.168.x.x:5001`. All devices on the same WiFi can access it.
