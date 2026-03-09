import express from 'express';
import { authenticate } from '../middleware/auth.js';
import codeforcesService from '../services/codeforcesService.js';
import progressiveSystemService from '../services/progressiveSystemService.js';
import dynamodbUserService from '../services/dynamodbUserService.js';
import {
  updateUserStreak,
  updateDailySolved,
  getTodayDate,
} from '../services/dynamodbService.js';

const router = express.Router();

// Cache for problems by rating
const problemsCache: { [rating: number]: any[] } = {};
let cacheTimestamp: { [rating: number]: number } = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get user's current progress and available rating
 */
router.get('/progress', authenticate, async (req, res) => {
  try {
    const progress = await progressiveSystemService.getUserProgress(req.userId!);
    const dailyAccess = await progressiveSystemService.getDailyQuestionAccess(req.userId!);

    res.json({
      currentRating: progress.currentRating,
      completedRatings: progress.completedRatings,
      totalQuestionsCompleted: progress.totalQuestionsCompleted,
      availableRatings: [progress.currentRating, ...progress.completedRatings],
      dailyQuestionsRemaining: progressiveSystemService.getRemainingQuestions(dailyAccess),
      dailyLimit: progressiveSystemService.DAILY_QUESTION_LIMIT,
      canAccessMore: progressiveSystemService.canAccessMoreQuestions(dailyAccess),
      allRatingLevels: progressiveSystemService.RATING_LEVELS,
      nextRating: progressiveSystemService.getNextRating(progress.currentRating),
    });
  } catch (error: any) {
    console.error('❌ Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * Get today's 3 questions for user's current rating
 */
router.get('/daily-questions', authenticate, async (req, res) => {
  try {
    const progress = await progressiveSystemService.getUserProgress(req.userId!);
    const dailyAccess = await progressiveSystemService.getDailyQuestionAccess(req.userId!);

    // Check if user can access more questions
    if (!progressiveSystemService.canAccessMoreQuestions(dailyAccess)) {
      return res.json({
        questions: [],
        message: 'Daily limit reached. Come back tomorrow for more questions!',
        questionsRemaining: 0,
        nextAvailableDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    const currentRating = progress.currentRating;

    // Get problems for current rating from cache or fetch
    let problems = problemsCache[currentRating];
    const now = Date.now();

    if (!problems || !cacheTimestamp[currentRating] || now - cacheTimestamp[currentRating] > CACHE_DURATION) {
      console.log('📊 Fetching problems for rating:', currentRating);

      const result = await codeforcesService.getProblems();
      
      // Filter by exact rating
      problems = result.problems
        .filter(p => p.rating === currentRating)
        .map((problem, index) => ({
          id: `CF-${problem.contestId}-${problem.index}`,
          contest_id: problem.contestId,
          problem_index: problem.index,
          title: problem.name,
          rating: problem.rating,
          tags: problem.tags,
          platform: 'Codeforces',
          problem_url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
        }));

      problemsCache[currentRating] = problems;
      cacheTimestamp[currentRating] = now;
      console.log(`✅ Cached ${problems.length} problems for rating ${currentRating}`);
    }

    if (problems.length === 0) {
      return res.json({
        questions: [],
        message: `No problems available for rating ${currentRating}. Please contact support.`,
        questionsRemaining: 0,
      });
    }

    // Calculate how many NEW questions we need to show
    const remainingQuestions = progressiveSystemService.getRemainingQuestions(dailyAccess);
    
    // Get questions user hasn't seen yet
    const unseenProblems = problems.filter(p => !dailyAccess.questionsShown.includes(p.id));
    
    // If all problems seen, allow repeating
    const availableProblems = unseenProblems.length > 0 ? unseenProblems : problems;

    // Select questions to show (only new ones up to remaining limit)
    const questionsToShow = availableProblems
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(remainingQuestions, 3));

    // Record access ONLY for NEW questions
    for (const question of questionsToShow) {
      if (!dailyAccess.questionsShown.includes(question.id)) {
        await progressiveSystemService.recordQuestionAccess(req.userId!, question.id);
      }
    }

    // Get updated daily access after recording
    const updatedAccess = await progressiveSystemService.getDailyQuestionAccess(req.userId!);

    // Add completion status
    const questionsWithStatus = questionsToShow.map(q => ({
      ...q,
      completed: updatedAccess.questionsCompleted.includes(q.id),
      hintUsed: updatedAccess.hintsUsed[q.id] || false,
    }));

    res.json({
      questions: questionsWithStatus,
      currentRating,
      questionsRemaining: progressiveSystemService.getRemainingQuestions(updatedAccess),
      totalShownToday: updatedAccess.accessCount,
      dailyLimit: progressiveSystemService.DAILY_QUESTION_LIMIT,
    });
  } catch (error: any) {
    console.error('❌ Error getting daily questions:', error);
    res.status(500).json({ error: 'Failed to get daily questions' });
  }
});

/**
 * Get hint for a specific problem
 */
router.get('/hint/:problemId', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const progress = await progressiveSystemService.getUserProgress(req.userId!);
    const dailyAccess = await progressiveSystemService.getDailyQuestionAccess(req.userId!);

    // Check if user has accessed this problem today
    if (!dailyAccess.questionsShown.includes(problemId)) {
      return res.status(403).json({ error: 'You have not accessed this problem today' });
    }

    // Find the problem
    const currentRating = progress.currentRating;
    const problems = problemsCache[currentRating] || [];
    const problem = problems.find(p => p.id === problemId);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Generate hint
    const hint = progressiveSystemService.generateHint(problem);

    // Record hint usage
    await progressiveSystemService.recordHintUsage(req.userId!, problemId);

    res.json({
      hint,
      problemTitle: problem.title,
      rating: problem.rating,
    });
  } catch (error: any) {
    console.error('❌ Error getting hint:', error);
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

/**
 * Verify problem solution
 */
router.post('/verify/:problemId', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { codeforcesHandle } = req.body;

    if (!codeforcesHandle) {
      return res.status(400).json({ error: 'Codeforces handle is required' });
    }

    const progress = await progressiveSystemService.getUserProgress(req.userId!);
    const dailyAccess = await progressiveSystemService.getDailyQuestionAccess(req.userId!);

    // Check if user has accessed this problem
    if (!dailyAccess.questionsShown.includes(problemId)) {
      return res.status(403).json({ error: 'You have not accessed this problem today' });
    }

    // Check if already completed
    if (dailyAccess.questionsCompleted.includes(problemId)) {
      return res.json({
        verified: true,
        message: 'You have already completed this problem today',
        alreadyCompleted: true,
      });
    }

    console.log('🔍 Verifying problem:', problemId, 'for handle:', codeforcesHandle);

    // Extract contest ID and problem index
    const parts = problemId.split('-');
    if (parts.length !== 3 || parts[0] !== 'CF') {
      return res.status(400).json({ error: 'Invalid problem ID format' });
    }

    const contestId = parseInt(parts[1]);
    const problemIndex = parts[2];

    // Verify with Codeforces
    const submissions = await codeforcesService.getUserSubmissions(codeforcesHandle);
    const solvedSubmission = submissions.find(
      sub =>
        sub.problem.contestId === contestId &&
        sub.problem.index === problemIndex &&
        sub.verdict === 'OK'
    );

    if (!solvedSubmission) {
      return res.json({
        verified: false,
        message: 'No successful submission found for this problem',
      });
    }

    // Save Codeforces handle
    const user = await dynamodbUserService.getUserById(req.userId!);
    if (user && !user.codeforcesHandle) {
      await dynamodbUserService.updateUser(req.userId!, { codeforcesHandle });
    }

    // Record completion
    await progressiveSystemService.recordQuestionCompletion(req.userId!, problemId);

    // Calculate XP based on rating
    const xpReward = Math.floor(progress.currentRating / 10);

    // Update user stats
    await dynamodbUserService.incrementUserStats(req.userId!, xpReward);
    progress.totalQuestionsCompleted++;
    await progressiveSystemService.saveUserProgress(progress);

    // Update streak
    const today = getTodayDate();
    const updatedStreak = await updateUserStreak(req.userId!, today);
    await dynamodbUserService.updateUserStreak(
      req.userId!,
      updatedStreak.currentStreak,
      updatedStreak.highestStreak
    );

    // Update daily solved
    await updateDailySolved(req.userId!, today, problemId, 'medium');

    // Check if rating level completed
    const updatedAccess = await progressiveSystemService.getDailyQuestionAccess(req.userId!);
    const currentRating = progress.currentRating;
    const totalProblemsAtRating = problemsCache[currentRating]?.length || 0;
    
    // Count unique completed problems at this rating across all days
    // For now, we'll unlock after completing 10 problems at current rating
    const PROBLEMS_TO_UNLOCK = 10;
    
    if (progress.totalQuestionsCompleted % PROBLEMS_TO_UNLOCK === 0 && 
        !progress.completedRatings.includes(currentRating)) {
      const updatedProgress = await progressiveSystemService.completeRatingLevel(
        req.userId!,
        currentRating
      );
      
      return res.json({
        verified: true,
        message: 'Problem verified successfully!',
        xpEarned: xpReward,
        currentStreak: updatedStreak.currentStreak,
        bestStreak: updatedStreak.highestStreak,
        levelCompleted: true,
        newRatingUnlocked: updatedProgress.currentRating,
        congratulations: `🎉 Congratulations! You've unlocked rating ${updatedProgress.currentRating}!`,
      });
    }

    res.json({
      verified: true,
      message: 'Problem verified successfully!',
      xpEarned: xpReward,
      currentStreak: updatedStreak.currentStreak,
      bestStreak: updatedStreak.highestStreak,
      questionsCompletedAtRating: progress.totalQuestionsCompleted,
      questionsToUnlock: PROBLEMS_TO_UNLOCK - (progress.totalQuestionsCompleted % PROBLEMS_TO_UNLOCK),
    });
  } catch (error: any) {
    console.error('❌ Error verifying problem:', error);
    res.status(500).json({ error: 'Failed to verify problem' });
  }
});

/**
 * Get statistics for current rating level
 */
router.get('/rating-stats', authenticate, async (req, res) => {
  try {
    const progress = await progressiveSystemService.getUserProgress(req.userId!);
    const currentRating = progress.currentRating;
    const problems = problemsCache[currentRating] || [];

    res.json({
      currentRating,
      totalProblemsAtRating: problems.length,
      completedProblems: progress.totalQuestionsCompleted,
      completedRatings: progress.completedRatings,
      progressPercentage: problems.length > 0 
        ? Math.min(100, (progress.totalQuestionsCompleted / 10) * 100)
        : 0,
    });
  } catch (error: any) {
    console.error('❌ Error getting rating stats:', error);
    res.status(500).json({ error: 'Failed to get rating stats' });
  }
});

/**
 * Reset daily access (for testing/debugging)
 */
router.post('/reset-daily', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const resetAccess = {
      userId: req.userId!,
      date: today,
      questionsShown: [],
      questionsCompleted: [],
      questionsAttempted: [],
      hintsUsed: {},
      accessCount: 0,
    };

    await progressiveSystemService.saveDailyQuestionAccess(resetAccess);
    
    res.json({
      message: 'Daily access reset successfully',
      access: resetAccess,
    });
  } catch (error: any) {
    console.error('❌ Error resetting daily access:', error);
    res.status(500).json({ error: 'Failed to reset daily access' });
  }
});

export default router;
