import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserStreak,
  getRecentActivity,
  getStreakTimeRemaining,
  isStreakExpiringSoon,
} from '../services/dynamodbService.js';
import dynamodbUserService from '../services/dynamodbUserService.js';

const router = express.Router();

// Get user's streak data
router.get('/me', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching streak for userId:', req.userId);
    
    // Get streak from UserStreaks table
    const streak = await getUserStreak(req.userId!);
    
    // Calculate time remaining before streak resets
    const timeRemaining = getStreakTimeRemaining(streak);
    const expiringSoon = isStreakExpiringSoon(streak);
    
    // Format time remaining for display
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    res.json({
      current_streak: streak.currentStreak,
      best_streak: streak.highestStreak,
      total_problems_solved: streak.totalProblemsSolved,
      last_solved_date: streak.lastSolvedDate,
      time_remaining_ms: timeRemaining,
      time_remaining_hours: hoursRemaining,
      time_remaining_minutes: minutesRemaining,
      expiring_soon: expiringSoon,
      streak_active: streak.currentStreak > 0,
    });
  } catch (error: any) {
    console.error('❌ Error fetching streak:', error);
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// Get streak history
router.get('/history', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching streak history for userId:', req.userId);
    
    // Get recent activity (last 30 days)
    const recentActivity = await getRecentActivity(req.userId!, 30);
    
    // Map to expected format
    const history = recentActivity.map(day => ({
      date: day.date,
      problems_completed: day.totalCount,
      xp_earned: day.easyCount * 50 + day.moderateCount * 100 + day.hardCount * 150 + day.difficultCount * 200,
    }));
    
    console.log('✅ Streak history fetched:', history.length, 'days');
    res.json(history);
  } catch (error: any) {
    console.error('❌ Error fetching streak history:', error);
    res.json([]);
  }
});

export default router;
