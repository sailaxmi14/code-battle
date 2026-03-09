import express from 'express';
import { authenticate } from '../middleware/auth.js';
import codeforcesService from '../services/codeforcesService.js';
import difficultyProgressionService, {
  DIFFICULTY_LEVELS,
  UNLOCK_REQUIREMENT,
  DifficultyLevel,
} from '../services/difficultyProgressionService.js';
import dynamodbUserService from '../services/dynamodbUserService.js';
import solvedProblemsService from '../services/solvedProblemsService.js';
import {
  updateUserStreak,
  updateDailySolved,
  getTodayDate,
} from '../services/dynamodbService.js';

const router = express.Router();

// Cache for problems by difficulty level
const problemsCache: { [level: string]: any[] } = {};
let cacheTimestamp: { [level: string]: number } = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Map difficulty levels to Codeforces rating ranges
const DIFFICULTY_RATING_MAP: { [key in DifficultyLevel]: { min: number; max: number } } = {
  'Basic': { min: 0, max: 800 },      // Dead Easy: rating ≤ 800
  'Easy': { min: 900, max: 1000 },    // Easy: rating 900-1000
  'Medium': { min: 1100, max: 1300 }, // Medium: rating 1100-1300
  'Hard': { min: 1500, max: 1700 },   // Hard: unchanged
  'Difficult': { min: 1800, max: 2000 }, // Difficult: unchanged
};

/**
 * Get user's difficulty progression progress
 */
router.get('/progress', authenticate, async (req, res) => {
  try {
    const progress = difficultyProgressionService.getUserProgress(req.userId!);
    const summary = difficultyProgressionService.getProgressSummary(req.userId!);

    res.json({
      ...progress,
      summary,
    });
  } catch (error: any) {
    console.error('❌ Error getting difficulty progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * Get questions for a specific difficulty level
 */
router.get('/questions/:level', authenticate, async (req, res) => {
  try {
    const level = req.params.level as DifficultyLevel;

    // Validate level
    if (!DIFFICULTY_LEVELS.includes(level)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    const progress = difficultyProgressionService.getUserProgress(req.userId!);

    // Check if level is unlocked
    if (!difficultyProgressionService.isLevelUnlocked(progress, level)) {
      return res.status(403).json({
        error: `${level} level is locked`,
        message: `Solve ${UNLOCK_REQUIREMENT} questions in the previous level to unlock ${level}`,
      });
    }

    // Get problems from cache or fetch
    const now = Date.now();
    let problems = problemsCache[level];

    if (!problems || !cacheTimestamp[level] || now - cacheTimestamp[level] > CACHE_DURATION) {
      console.log(`📊 Fetching problems for ${level} level`);

      const ratingRange = DIFFICULTY_RATING_MAP[level];
      const result = await codeforcesService.getProblems();

      // Define beginner-friendly tags for Basic level
      const beginnerTags = ['implementation', 'math', 'brute force', 'strings', 'constructive algorithms'];
      const avoidTags = ['greedy', 'dp', 'graphs', 'trees', 'data structures', 'dfs and similar', 'bfs', 'binary search'];

      // Filter by rating range and ensure valid contest problems
      problems = result.problems
        .filter(p => {
          // Must have rating in range
          if (!p.rating || p.rating < ratingRange.min || p.rating > ratingRange.max) {
            return false;
          }
          // Must have valid contestId (not undefined, not null, and is a number)
          if (!p.contestId || typeof p.contestId !== 'number') {
            return false;
          }
          // Must have valid index
          if (!p.index || typeof p.index !== 'string') {
            return false;
          }
          // Exclude problems from problemset (they might be restricted)
          if (p.problemsetName) {
            return false;
          }

          // For Basic level, filter by beginner-friendly tags
          if (level === 'Basic') {
            // Check if problem has any beginner-friendly tags
            const hasBeginnerTag = p.tags.some(tag => 
              beginnerTags.some(bt => tag.toLowerCase().includes(bt.toLowerCase()))
            );
            
            // Check if problem has any advanced tags to avoid
            const hasAdvancedTag = p.tags.some(tag => 
              avoidTags.some(at => tag.toLowerCase().includes(at.toLowerCase()))
            );

            // Only include if has beginner tag and no advanced tags
            if (!hasBeginnerTag || hasAdvancedTag) {
              return false;
            }
          }

          return true;
        })
        .map(problem => ({
          id: `CF-${problem.contestId}-${problem.index}`,
          contest_id: problem.contestId,
          problem_index: problem.index,
          title: problem.name,
          rating: problem.rating,
          tags: problem.tags,
          platform: 'Codeforces',
          problem_url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
          difficulty: level,
        }));

      problemsCache[level] = problems;
      cacheTimestamp[level] = now;
      console.log(`✅ Cached ${problems.length} problems for ${level} level`);
    }

    // Shuffle and return random selection
    const shuffled = [...problems].sort(() => 0.5 - Math.random());
    const questionsToShow = shuffled.slice(0, 20); // Show 20 random questions

    res.json({
      level,
      questions: questionsToShow,
      totalAvailable: problems.length,
      progress: progress.progressByLevel[level],
    });
  } catch (error: any) {
    console.error('❌ Error getting questions:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

/**
 * Get today's 3 daily problems for user's current level
 */
router.get('/daily-problems', authenticate, async (req, res) => {
  try {
    const progress = difficultyProgressionService.getUserProgress(req.userId!);
    const currentLevel = progress.currentLevel;

    // Get problems from cache or fetch
    const now = Date.now();
    let problems = problemsCache[currentLevel];
    const ratingRange = DIFFICULTY_RATING_MAP[currentLevel];

    if (!problems || !cacheTimestamp[currentLevel] || now - cacheTimestamp[currentLevel] > CACHE_DURATION) {
      console.log(`📊 Fetching problems for ${currentLevel} level`);

      const result = await codeforcesService.getProblems();

      // Define beginner-friendly tags for Basic level
      const beginnerTags = ['implementation', 'math', 'brute force', 'strings', 'constructive algorithms'];
      const avoidTags = ['greedy', 'dp', 'graphs', 'trees', 'data structures', 'dfs and similar', 'bfs', 'binary search'];

      // Filter by rating range and ensure valid contest problems
      problems = result.problems
        .filter(p => {
          // Must have rating in range
          if (!p.rating || p.rating < ratingRange.min || p.rating > ratingRange.max) {
            return false;
          }
          // Must have valid contestId (not undefined, not null, and is a number)
          if (!p.contestId || typeof p.contestId !== 'number') {
            return false;
          }
          // Must have valid index
          if (!p.index || typeof p.index !== 'string') {
            return false;
          }
          // Exclude problems from problemset (they might be restricted)
          if (p.problemsetName) {
            return false;
          }

          // For Basic level, filter by beginner-friendly tags
          if (currentLevel === 'Basic') {
            // Check if problem has any beginner-friendly tags
            const hasBeginnerTag = p.tags.some(tag => 
              beginnerTags.some(bt => tag.toLowerCase().includes(bt.toLowerCase()))
            );
            
            // Check if problem has any advanced tags to avoid
            const hasAdvancedTag = p.tags.some(tag => 
              avoidTags.some(at => tag.toLowerCase().includes(at.toLowerCase()))
            );

            // Only include if has beginner tag and no advanced tags
            if (!hasBeginnerTag || hasAdvancedTag) {
              return false;
            }
          }

          return true;
        })
        .map(problem => ({
          id: `CF-${problem.contestId}-${problem.index}`,
          contest_id: problem.contestId,
          problem_index: problem.index,
          title: problem.name,
          rating: problem.rating,
          tags: problem.tags,
          platform: 'Codeforces',
          problem_url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
          difficulty: currentLevel,
        }));

      problemsCache[currentLevel] = problems;
      cacheTimestamp[currentLevel] = now;
      console.log(`✅ Cached ${problems.length} problems for ${currentLevel} level`);
    }

    if (problems.length === 0) {
      return res.json({
        questions: [],
        message: `No problems available for ${currentLevel} level.`,
        currentLevel,
      });
    }

    // Get today's date as seed for consistent daily selection
    const today = new Date().toISOString().split('T')[0];
    const seed = today + req.userId;
    
    // Simple hash function for seeded random
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }

    // Use hash to select 3 problems consistently for today
    const selectedProblems: any[] = [];
    const problemCount = Math.min(3, problems.length);
    
    for (let i = 0; i < problemCount; i++) {
      const index = Math.abs(hash + i * 1000) % problems.length;
      if (!selectedProblems.find(p => p.id === problems[index].id)) {
        selectedProblems.push(problems[index]);
      }
    }

    // Fill remaining if duplicates occurred
    while (selectedProblems.length < problemCount) {
      const randomIndex = Math.floor(Math.random() * problems.length);
      if (!selectedProblems.find(p => p.id === problems[randomIndex].id)) {
        selectedProblems.push(problems[randomIndex]);
      }
    }

    // Fetch user's solved problems to mark completed ones
    const solvedProblems = await solvedProblemsService.getUserSolvedProblems(req.userId!);
    const solvedProblemIds = new Set(solvedProblems.map(p => p.problemId));
    
    // Mark which problems are completed
    const questionsWithStatus = selectedProblems.map(q => ({
      ...q,
      completed: solvedProblemIds.has(q.id),
    }));

    res.json({
      questions: questionsWithStatus,
      currentLevel,
      progress: progress.progressByLevel[currentLevel],
      totalAvailable: problems.length,
      solvedToday: questionsWithStatus.filter(q => q.completed).length,
    });
  } catch (error: any) {
    console.error('❌ Error getting daily problems:', error);
    res.status(500).json({ error: 'Failed to get daily problems' });
  }
});

/**
 * Get hint for a specific problem
 */
router.get('/hint/:problemId', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const progress = difficultyProgressionService.getUserProgress(req.userId!);
    const currentLevel = progress.currentLevel;

    // Find the problem
    const problems = problemsCache[currentLevel] || [];
    const problem = problems.find(p => p.id === problemId);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Generate hint based on tags
    const hint = {
      problemId,
      topics: problem.tags.slice(0, 5),
      approach: generateApproach(problem.tags, problem.rating),
      keyIdea: generateKeyIdea(problem.tags),
      thinkingProcess: generateThinkingProcess(problem.tags),
    };

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

// Helper functions for hint generation
function generateApproach(tags: string[], rating: number): string {
  const mainTag = tags[0] || 'implementation';
  
  const approaches: { [key: string]: string } = {
    'greedy': 'Sort the elements and apply a greedy strategy by making locally optimal choices at each step.',
    'dp': 'Break down the problem into smaller subproblems and use dynamic programming to store intermediate results.',
    'dynamic programming': 'Break down the problem into smaller subproblems and use dynamic programming to store intermediate results.',
    'math': 'Look for mathematical patterns or formulas. Consider number theory, combinatorics, or algebraic manipulation.',
    'implementation': 'Focus on careful implementation following the problem requirements step by step.',
    'brute force': 'Try all possible combinations systematically. Consider optimization if time limit is tight.',
    'binary search': 'The answer space is monotonic. Use binary search to find the optimal value efficiently.',
    'two pointers': 'Use two pointers moving from different positions to find the solution in linear time.',
    'sorting': 'Sort the array first, then apply the required logic on the sorted elements.',
    'graphs': 'Model the problem as a graph. Consider BFS, DFS, or shortest path algorithms.',
    'trees': 'Think about tree traversal (preorder, inorder, postorder) or tree properties.',
    'strings': 'Consider string manipulation techniques like pattern matching, prefix/suffix analysis.',
    'dfs and similar': 'Use depth-first search to explore all possibilities or paths in the problem.',
    'constructive algorithms': 'Build the solution step by step, ensuring each step maintains validity.',
  };

  return approaches[mainTag] || 'Analyze the problem constraints and think about the most efficient approach.';
}

function generateKeyIdea(tags: string[]): string {
  const mainTag = tags[0] || 'implementation';
  
  const keyIdeas: { [key: string]: string } = {
    'greedy': 'Make the best choice at each step without reconsidering previous choices.',
    'dp': 'Optimal substructure: the solution can be constructed from solutions to subproblems.',
    'dynamic programming': 'Optimal substructure: the solution can be constructed from solutions to subproblems.',
    'math': 'Find the mathematical relationship or formula that directly solves the problem.',
    'implementation': 'Follow the problem statement carefully and implement each requirement correctly.',
    'brute force': 'Generate all possibilities and check which one satisfies the conditions.',
    'binary search': 'If checking a value is easy, binary search can find the optimal value quickly.',
    'two pointers': 'Maintain two pointers and move them based on certain conditions to find the answer.',
    'sorting': 'Sorting often reveals patterns or makes the problem easier to solve.',
    'graphs': 'Identify vertices and edges, then apply appropriate graph algorithms.',
    'trees': 'Use recursion or iterative traversal to process tree nodes.',
    'strings': 'Look for patterns, prefixes, suffixes, or use string algorithms like KMP.',
    'dfs and similar': 'Explore all paths systematically using recursion or stack.',
    'constructive algorithms': 'Build the answer incrementally, ensuring correctness at each step.',
  };

  return keyIdeas[mainTag] || 'Break down the problem into smaller, manageable parts.';
}

function generateThinkingProcess(tags: string[]): string[] {
  const process = [
    'Read the problem carefully and identify the input/output format',
    'Look at the constraints to determine the time complexity needed',
    'Think about edge cases (empty input, single element, maximum values)',
  ];

  if (tags.includes('greedy')) {
    process.push('Can you make a locally optimal choice that leads to a global optimum?');
    process.push('What should you sort or prioritize first?');
  } else if (tags.includes('dp') || tags.includes('dynamic programming')) {
    process.push('What are the states? What transitions exist between states?');
    process.push('Can you define dp[i] in terms of previous values?');
  } else if (tags.includes('math')) {
    process.push('Is there a formula or pattern you can derive?');
    process.push('Can you simplify the problem mathematically?');
  } else if (tags.includes('binary search')) {
    process.push('Is the answer space monotonic (if X works, does X+1 also work)?');
    process.push('Can you write a check function to verify if a value is valid?');
  } else {
    process.push('What data structures would be most helpful?');
    process.push('Can you solve a simpler version of the problem first?');
  }

  return process;
}

/**
 * Mark a question as completed
 */
router.post('/complete/:level/:questionId', authenticate, async (req, res) => {
  try {
    const level = req.params.level as DifficultyLevel;
    const questionId = req.params.questionId;
    const { codeforcesHandle } = req.body;

    // Validate level
    if (!DIFFICULTY_LEVELS.includes(level)) {
      return res.status(400).json({ 
        error: 'Invalid difficulty level',
        message: 'The specified difficulty level is not valid.'
      });
    }

    // Validate Codeforces handle
    if (!codeforcesHandle || codeforcesHandle.trim() === '') {
      return res.status(400).json({ 
        error: 'Codeforces handle is required',
        message: 'Please provide your Codeforces username.'
      });
    }

    // Validate handle format (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(codeforcesHandle)) {
      return res.status(400).json({ 
        error: 'Invalid Codeforces handle format',
        message: 'Codeforces handle can only contain letters, numbers, underscores, and hyphens.'
      });
    }

    console.log(`🔍 Verifying ${level} problem:`, questionId, 'for handle:', codeforcesHandle);

    // Extract contest ID and problem index
    const parts = questionId.split('-');
    if (parts.length !== 3 || parts[0] !== 'CF') {
      return res.status(400).json({ 
        error: 'Invalid problem ID format',
        message: 'The problem ID format is incorrect.'
      });
    }

    const contestId = parseInt(parts[1]);
    const problemIndex = parts[2];

    if (isNaN(contestId)) {
      return res.status(400).json({ 
        error: 'Invalid contest ID',
        message: 'The contest ID must be a number.'
      });
    }

    // Verify with Codeforces with timeout and error handling
    let submissions;
    try {
      submissions = await Promise.race([
        codeforcesService.getUserSubmissions(codeforcesHandle),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Codeforces API timeout')), 10000)
        )
      ]) as any[];
    } catch (cfError: any) {
      console.error('❌ Codeforces API error:', cfError.message);
      
      if (cfError.message?.includes('timeout')) {
        return res.status(504).json({
          verified: false,
          message: 'Codeforces API is taking too long to respond. Please try again in a moment.'
        });
      }
      
      if (cfError.message?.includes('handle')) {
        return res.status(400).json({
          verified: false,
          message: `Codeforces handle "${codeforcesHandle}" not found. Please check your username.`
        });
      }
      
      return res.status(503).json({
        verified: false,
        message: 'Unable to connect to Codeforces. Please try again later.'
      });
    }

    // Check for accepted submission
    const solvedSubmission = submissions.find(
      sub =>
        sub.problem.contestId === contestId &&
        sub.problem.index === problemIndex &&
        sub.verdict === 'OK'
    );

    if (!solvedSubmission) {
      return res.json({
        verified: false,
        message: 'No Accepted submission found yet. Please submit your solution on Codeforces first.'
      });
    }

    // Save Codeforces handle if not already saved
    try {
      const user = await dynamodbUserService.getUserById(req.userId!);
      if (user && !user.codeforcesHandle) {
        await dynamodbUserService.updateUser(req.userId!, { codeforcesHandle });
      }
    } catch (dbError) {
      console.error('⚠️ Failed to save Codeforces handle:', dbError);
      // Continue anyway - verification is more important
    }

    // Record completion
    const result = difficultyProgressionService.recordQuestionCompletion(
      req.userId!,
      level,
      questionId
    );

    // Calculate XP based on difficulty
    const xpMap: { [key in DifficultyLevel]: number } = {
      'Basic': 10,
      'Easy': 20,
      'Medium': 30,
      'Hard': 50,
      'Difficult': 75,
    };
    const xpReward = xpMap[level] || 10;

    // Get problem details for saving
    const problems = problemsCache[level] || [];
    const problemDetails = problems.find(p => p.id === questionId);

    // Save to SolvedProblems table
    try {
      await solvedProblemsService.saveSolvedProblem({
        userId: req.userId!,
        problemId: questionId,
        problemTitle: problemDetails?.title || 'Unknown Problem',
        difficulty: level as any,
        solvedAt: Date.now(),
        xpEarned: xpReward,
        platform: 'Codeforces',
        submissionUrl: `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
      });
      console.log('✅ Saved to SolvedProblems table:', questionId);
    } catch (saveError: any) {
      // If already solved, that's okay - continue
      if (!saveError.message?.includes('already solved')) {
        console.error('⚠️ Failed to save solved problem:', saveError);
      }
    }

    // Update user stats
    try {
      await dynamodbUserService.incrementUserStats(req.userId!, xpReward);
    } catch (statsError) {
      console.error('⚠️ Failed to update user stats:', statsError);
    }

    // Update streak
    try {
      const today = getTodayDate();
      const updatedStreak = await updateUserStreak(req.userId!, today);
      await dynamodbUserService.updateUserStreak(
        req.userId!,
        updatedStreak.currentStreak,
        updatedStreak.highestStreak
      );

      // Update daily solved
      await updateDailySolved(req.userId!, today, questionId, 'medium');

      res.json({
        verified: true,
        message: result.message,
        xpEarned: xpReward,
        currentStreak: updatedStreak.currentStreak,
        bestStreak: updatedStreak.highestStreak,
        levelUnlocked: result.levelUnlocked,
        unlockedLevel: result.unlockedLevel,
        progress: result.progress.progressByLevel[level],
        summary: difficultyProgressionService.getProgressSummary(req.userId!),
      });
    } catch (streakError) {
      console.error('⚠️ Failed to update streak:', streakError);
      
      // Return success anyway since problem was verified
      res.json({
        verified: true,
        message: result.message,
        xpEarned: xpReward,
        levelUnlocked: result.levelUnlocked,
        unlockedLevel: result.unlockedLevel,
        progress: result.progress.progressByLevel[level],
        summary: difficultyProgressionService.getProgressSummary(req.userId!),
      });
    }
  } catch (error: any) {
    console.error('❌ Error completing question:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('Network')) {
      return res.status(503).json({ 
        error: 'Network error',
        message: 'Unable to connect to verification service. Please check your connection.'
      });
    }
    
    res.status(500).json({ 
      error: 'Verification failed',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

/**
 * Reset user progress (for testing)
 */
router.post('/reset', authenticate, async (req, res) => {
  try {
    difficultyProgressionService.resetUserProgress(req.userId!);
    
    res.json({
      message: 'Progress reset successfully',
      progress: difficultyProgressionService.getUserProgress(req.userId!),
    });
  } catch (error: any) {
    console.error('❌ Error resetting progress:', error);
    res.status(500).json({ error: 'Failed to reset progress' });
  }
});

/**
 * Get statistics (admin)
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = difficultyProgressionService.getAllUsersStats();
    res.json(stats);
  } catch (error: any) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
