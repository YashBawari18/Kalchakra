import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('kalchakra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 - force logout
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kalchakra_token');
      localStorage.removeItem('kalchakra_role');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (teamId, password) => API.post('/api/auth/login', { teamId, password });
export const getMe = () => API.get('/api/auth/me');
export const logout = () => API.post('/api/auth/logout');

// Game
export const getQuestion = (round) => API.get(`/api/game/question/${round}`);
export const submitAnswer = (round, data) => API.post(`/api/game/submit/${round}`, data);
export const getLeaderboard = () => API.get('/api/game/leaderboard');
export const reportPenalty = (type) => API.post('/api/game/penalty', { type });

// Admin
const ADMIN_KEY = localStorage.getItem('kalchakra_admin_key') || '';
const adminHeaders = () => ({ headers: { 'x-admin-key': localStorage.getItem('kalchakra_admin_key') || '' } });

export const adminGetTeams = () => API.get('/api/admin/teams', adminHeaders());
export const adminCreateTeam = (data) => API.post('/api/admin/teams', data, adminHeaders());
export const adminGetGameState = () => API.get('/api/admin/gamestate', adminHeaders());
export const adminStartGame = () => API.post('/api/admin/game/start', {}, adminHeaders());
export const adminStopGame = () => API.post('/api/admin/game/stop', {}, adminHeaders());
export const adminUnlockRound = (round) => API.post('/api/admin/unlock-round', { round }, adminHeaders());
export const adminFreezeTeam = (teamId, seconds) => API.post('/api/admin/freeze', { teamId, seconds }, adminHeaders());
export const adminPenaltyTeam = (teamId, points, reason) => API.post('/api/admin/penalty', { teamId, points, reason }, adminHeaders());
export const adminBroadcast = (message) => API.post('/api/admin/broadcast', { message }, adminHeaders());
export const adminLabAssistant = (question, answer, seconds) => API.post('/api/admin/lab-assistant', { question, answer, seconds }, adminHeaders());
export const adminLeaderboard = () => API.get('/api/admin/leaderboard', adminHeaders());
export const adminReset = () => API.delete('/api/admin/reset', adminHeaders());

export default API;
