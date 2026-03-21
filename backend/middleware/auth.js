const jwt = require('jsonwebtoken');
const Team = require('../models/Team');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const team = await Team.findOne({ teamId: decoded.teamId });

    if (!team || !team.isActive) return res.status(401).json({ error: 'Invalid session' });

    // One session per team - check token matches
    if (team.sessionToken !== token) {
      return res.status(401).json({ error: 'Session expired. Another device logged in.' });
    }

    req.team = team;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

exports.adminProtect = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  next();
};
