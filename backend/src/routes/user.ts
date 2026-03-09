import express from 'express';
import { authenticate } from '../middleware/auth.js';
import dynamodbUserService from '../services/dynamodbUserService.js';
import { mockUsers, MOCK_MODE } from '../services/mockStore.js';

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching user profile for userId:', req.userId);
    
    const user = await dynamodbUserService.getUserById(req.userId!);
    
    if (!user) {
      console.error('❌ User not found:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get streak information with timer
    const { getUserStreak, getStreakTimeRemaining, isStreakExpiringSoon } = await import('../services/dynamodbService.js');
    const streak = await getUserStreak(req.userId!);
    const timeRemaining = getStreakTimeRemaining(streak);
    const expiringSoon = isStreakExpiringSoon(streak);
    
    console.log('✅ User profile fetched successfully');
    res.json({
      ...user,
      streakTimeRemaining: timeRemaining,
      streakExpiringSoon: expiringSoon,
    });
  } catch (error: any) {
    console.error('❌ Error fetching user:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, college, codeforcesHandle } = req.body;
    
    const updates: any = {};
    if (name) updates.name = name;
    if (college) updates.college = college;
    if (codeforcesHandle !== undefined) updates.codeforcesHandle = codeforcesHandle;
    
    const user = await dynamodbUserService.updateUser(req.userId!, updates);
    console.log('✅ User profile updated');
    res.json(user);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user's connected platforms (placeholder)
router.get('/platforms', authenticate, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

// Connect a platform (placeholder)
router.post('/platforms', authenticate, async (req, res) => {
  try {
    const { platform_name, username } = req.body;
    res.json({ platform_name, username, verified: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect platform' });
  }
});

// Delete a platform (placeholder)
router.delete('/platforms/:platform_name', authenticate, async (req, res) => {
  try {
    res.json({ message: 'Platform disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

export default router;
