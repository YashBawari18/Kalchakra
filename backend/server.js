require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');
const registrationRoutes = require('./routes/registration');
const path = require('path');

const app = express();
const server = http.createServer(app);
const developmentOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3001'
];

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? '*' : developmentOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
const corsOrigin = process.env.NODE_ENV === 'production' ? '*' : developmentOrigins;
app.use(cors({ origin: corsOrigin }));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React frontend build in production
const frontendBuild = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuild));

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/register', registrationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'KALCHAKRA SERVER ONLINE', time: new Date() }));

// Catch-all: serve React app for any non-API route (fixes reload 404 on Render)
const fs = require('fs');
const indexHtml = path.join(frontendBuild, 'index.html');
app.get('*', (req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).json({ error: 'Not found. Run npm run build to generate the frontend.' });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId.toUpperCase()}`);
    console.log(`Team ${teamId} joined their room`);
  });

  socket.on('join_admin', () => {
    socket.join('admin_room');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server immediately so Render doesn't timeout waiting for port to bind
// Port 5000 is commonly reserved by macOS services. Keep this in sync with
// the frontend development proxy and its API/socket fallbacks.
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✓ Kalchakra server running on port ${PORT}`);
  console.log(`  Admin key: ${process.env.ADMIN_KEY}`);
});

// Connect to MongoDB asynchronously (after server is already listening)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB connection error:', err.message));
