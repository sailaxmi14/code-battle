// Load environment variables FIRST
import './config/env.js';

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import codeforcesRoutes from './routes/codeforces.js';
// DynamoDB-based routes
import questionsRoutes from './routes/questions.js';
import progressRoutes from './routes/progress.js';
import dynamoProblemsRoutes from './routes/dynamoProblems.js';
import dynamoHistoryRoutes from './routes/dynamoHistory.js';
import dynamoStreaksRoutes from './routes/dynamoStreaks.js';
import dynamoLeaderboardRoutes from './routes/dynamoLeaderboard.js';
import analyticsRoutes from './routes/analytics.js';
import codeforcesProblemsRoutes from './routes/codeforcesProblems.js';
import solvedProblemsRoutes from './routes/solvedProblems.js';
import progressiveSystemRoutes from './routes/progressiveSystem.js';
import difficultyProgressionRoutes from './routes/difficultyProgression.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://3.239.212.18:8080',
  'http://3.239.212.18:8081',
  'http://3.239.212.18',
  process.env.FRONTEND_URL || 'http://localhost:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', dynamoProblemsRoutes);
app.use('/api/codeforces-problems', codeforcesProblemsRoutes);
app.use('/api/streaks', dynamoStreaksRoutes);
app.use('/api/leaderboard', dynamoLeaderboardRoutes);
app.use('/api/history', dynamoHistoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/solved-problems', solvedProblemsRoutes);
app.use('/api/progressive', progressiveSystemRoutes);
app.use('/api/difficulty', difficultyProgressionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/codeforces', codeforcesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/progress', progressRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log('💾 Using DynamoDB for data storage');
});
