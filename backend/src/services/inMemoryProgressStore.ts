// In-memory storage for progressive system (fallback when DynamoDB has issues)

interface UserProgressData {
  userId: string;
  currentRating: number;
  completedRatings: number[];
  totalQuestionsCompleted: number;
  lastUpdated: string;
}

interface DailyQuestionAccess {
  userId: string;
  date: string;
  questionsShown: string[];
  questionsCompleted: string[];
  questionsAttempted: string[];
  hintsUsed: { [problemId: string]: boolean };
  accessCount: number;
}

// In-memory stores
const userProgressStore = new Map<string, UserProgressData>();
const dailyAccessStore = new Map<string, DailyQuestionAccess>();

export const inMemoryStore = {
  // User Progress
  getUserProgress(userId: string): UserProgressData | null {
    return userProgressStore.get(userId) || null;
  },

  saveUserProgress(progress: UserProgressData): void {
    userProgressStore.set(progress.userId, progress);
  },

  // Daily Access
  getDailyAccess(userId: string, date: string): DailyQuestionAccess | null {
    const key = `${userId}:${date}`;
    return dailyAccessStore.get(key) || null;
  },

  saveDailyAccess(access: DailyQuestionAccess): void {
    const key = `${access.userId}:${access.date}`;
    dailyAccessStore.set(key, access);
  },

  // Clear all data (for testing)
  clearAll(): void {
    userProgressStore.clear();
    dailyAccessStore.clear();
  },

  // Get stats
  getStats() {
    return {
      totalUsers: userProgressStore.size,
      totalDailyRecords: dailyAccessStore.size,
    };
  },
};

export default inMemoryStore;
