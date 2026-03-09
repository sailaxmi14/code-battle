// Difficulty Progression System - 5 Levels with 51-question unlock requirement

export const DIFFICULTY_LEVELS = [
  'Basic',
  'Easy',
  'Medium',
  'Hard',
  'Difficult'
] as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const UNLOCK_REQUIREMENT = 51; // Questions needed to unlock next level

export interface DifficultyProgress {
  userId: string;
  currentLevel: DifficultyLevel;
  unlockedLevels: DifficultyLevel[];
  progressByLevel: {
    [key in DifficultyLevel]: {
      solved: number;
      total: number;
      unlocked: boolean;
    };
  };
  lastUpdated: string;
}

// In-memory storage
const userProgressMap = new Map<string, DifficultyProgress>();

/**
 * Initialize user progress
 */
export function initializeUserProgress(userId: string): DifficultyProgress {
  const progress: DifficultyProgress = {
    userId,
    currentLevel: 'Basic',
    unlockedLevels: ['Basic'],
    progressByLevel: {
      'Basic': { solved: 0, total: 100, unlocked: true },
      'Easy': { solved: 0, total: 100, unlocked: false },
      'Medium': { solved: 0, total: 100, unlocked: false },
      'Hard': { solved: 0, total: 100, unlocked: false },
      'Difficult': { solved: 0, total: 100, unlocked: false },
    },
    lastUpdated: new Date().toISOString(),
  };

  userProgressMap.set(userId, progress);
  console.log('✅ Initialized difficulty progress for user:', userId);
  return progress;
}

/**
 * Get user progress
 */
export function getUserProgress(userId: string): DifficultyProgress {
  let progress = userProgressMap.get(userId);
  if (!progress) {
    progress = initializeUserProgress(userId);
  }
  return progress;
}

/**
 * Save user progress
 */
export function saveUserProgress(progress: DifficultyProgress): void {
  progress.lastUpdated = new Date().toISOString();
  userProgressMap.set(progress.userId, progress);
}

/**
 * Check if a level is unlocked
 */
export function isLevelUnlocked(progress: DifficultyProgress, level: DifficultyLevel): boolean {
  return progress.unlockedLevels.includes(level);
}

/**
 * Get next level to unlock
 */
export function getNextLevel(currentLevel: DifficultyLevel): DifficultyLevel | null {
  const currentIndex = DIFFICULTY_LEVELS.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === DIFFICULTY_LEVELS.length - 1) {
    return null;
  }
  return DIFFICULTY_LEVELS[currentIndex + 1];
}

/**
 * Check if user can unlock next level
 */
export function canUnlockNextLevel(progress: DifficultyProgress, level: DifficultyLevel): boolean {
  const levelProgress = progress.progressByLevel[level];
  return levelProgress.solved >= UNLOCK_REQUIREMENT;
}

/**
 * Unlock next level
 */
export function unlockNextLevel(progress: DifficultyProgress, currentLevel: DifficultyLevel): {
  unlocked: boolean;
  newLevel: DifficultyLevel | null;
  message: string;
} {
  const nextLevel = getNextLevel(currentLevel);
  
  if (!nextLevel) {
    return {
      unlocked: false,
      newLevel: null,
      message: 'You have completed all difficulty levels!',
    };
  }

  if (!canUnlockNextLevel(progress, currentLevel)) {
    const remaining = UNLOCK_REQUIREMENT - progress.progressByLevel[currentLevel].solved;
    return {
      unlocked: false,
      newLevel: null,
      message: `Solve ${remaining} more ${currentLevel} questions to unlock ${nextLevel} level.`,
    };
  }

  // Unlock the next level
  if (!progress.unlockedLevels.includes(nextLevel)) {
    progress.unlockedLevels.push(nextLevel);
    progress.progressByLevel[nextLevel].unlocked = true;
    progress.currentLevel = nextLevel;
    saveUserProgress(progress);

    console.log(`🎉 Level unlocked for user ${progress.userId}: ${nextLevel}`);
    
    return {
      unlocked: true,
      newLevel: nextLevel,
      message: `🎉 Congratulations! ${nextLevel} Level Unlocked!`,
    };
  }

  return {
    unlocked: false,
    newLevel: null,
    message: 'Level already unlocked',
  };
}

/**
 * Record question completion
 */
export function recordQuestionCompletion(
  userId: string,
  level: DifficultyLevel,
  questionId: string
): {
  progress: DifficultyProgress;
  levelUnlocked: boolean;
  unlockedLevel: DifficultyLevel | null;
  message: string;
} {
  const progress = getUserProgress(userId);

  // Check if level is unlocked
  if (!isLevelUnlocked(progress, level)) {
    return {
      progress,
      levelUnlocked: false,
      unlockedLevel: null,
      message: `${level} level is locked. Complete previous levels first.`,
    };
  }

  // Increment solved count
  progress.progressByLevel[level].solved++;
  saveUserProgress(progress);

  console.log(`✅ Question completed: ${level} - ${progress.progressByLevel[level].solved}/${UNLOCK_REQUIREMENT}`);

  // Check if next level should be unlocked
  const unlockResult = unlockNextLevel(progress, level);

  return {
    progress,
    levelUnlocked: unlockResult.unlocked,
    unlockedLevel: unlockResult.newLevel,
    message: unlockResult.message,
  };
}

/**
 * Get progress summary
 */
export function getProgressSummary(userId: string) {
  const progress = getUserProgress(userId);
  const currentLevelProgress = progress.progressByLevel[progress.currentLevel];
  const nextLevel = getNextLevel(progress.currentLevel);
  const canUnlock = canUnlockNextLevel(progress, progress.currentLevel);
  const remaining = UNLOCK_REQUIREMENT - currentLevelProgress.solved;

  return {
    currentLevel: progress.currentLevel,
    unlockedLevels: progress.unlockedLevels,
    currentProgress: {
      solved: currentLevelProgress.solved,
      required: UNLOCK_REQUIREMENT,
      remaining: Math.max(0, remaining),
      percentage: Math.min(100, (currentLevelProgress.solved / UNLOCK_REQUIREMENT) * 100),
    },
    nextLevel,
    canUnlockNext: canUnlock,
    allLevels: DIFFICULTY_LEVELS.map(level => ({
      name: level,
      unlocked: progress.unlockedLevels.includes(level),
      solved: progress.progressByLevel[level].solved,
      total: progress.progressByLevel[level].total,
      progress: (progress.progressByLevel[level].solved / UNLOCK_REQUIREMENT) * 100,
    })),
  };
}

/**
 * Reset user progress (for testing)
 */
export function resetUserProgress(userId: string): void {
  userProgressMap.delete(userId);
  console.log('🔄 Reset progress for user:', userId);
}

/**
 * Get all users stats (for admin)
 */
export function getAllUsersStats() {
  const stats = {
    totalUsers: userProgressMap.size,
    usersByLevel: {} as Record<DifficultyLevel, number>,
  };

  DIFFICULTY_LEVELS.forEach(level => {
    stats.usersByLevel[level] = 0;
  });

  userProgressMap.forEach(progress => {
    stats.usersByLevel[progress.currentLevel]++;
  });

  return stats;
}

export default {
  DIFFICULTY_LEVELS,
  UNLOCK_REQUIREMENT,
  getUserProgress,
  saveUserProgress,
  isLevelUnlocked,
  getNextLevel,
  canUnlockNextLevel,
  unlockNextLevel,
  recordQuestionCompletion,
  getProgressSummary,
  resetUserProgress,
  getAllUsersStats,
};
