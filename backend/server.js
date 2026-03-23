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

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
const corsOrigin = process.env.NODE_ENV === 'production' ? '*' : (process.env.CLIENT_URL || 'http://localhost:3000');
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
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
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
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✓ Kalchakra server running on port ${PORT}`);
  console.log(`  Admin key: ${process.env.ADMIN_KEY}`);
});

// Connect to MongoDB asynchronously (after server is already listening)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB connection error:', err.message));

