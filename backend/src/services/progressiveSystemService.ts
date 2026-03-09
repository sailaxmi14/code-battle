import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import inMemoryStore from './inMemoryProgressStore.js';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names
const USER_PROGRESS_TABLE = 'CodeBattleUserProgress';
const DAILY_QUESTIONS_TABLE = 'CodeBattleDailyQuestions';

// Use in-memory storage by default (DynamoDB tables have schema issues)
const USE_MEMORY_STORE = true;

// Rating levels in ascending order
export const RATING_LEVELS = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000];

// Daily question limit
export const DAILY_QUESTION_LIMIT = 3;

export interface UserProgressData {
  userId: string;
  currentRating: number;
  completedRatings: number[]; // List of fully completed rating levels
  totalQuestionsCompleted: number;
  lastUpdated: string;
}

export interface DailyQuestionAccess {
  userId: string;
  date: string; // YYYY-MM-DD
  questionsShown: string[]; // Problem IDs shown today
  questionsCompleted: string[]; // Problem IDs completed today
  questionsAttempted: string[]; // Problem IDs attempted today
  hintsUsed: { [problemId: string]: boolean };
  accessCount: number; // Number of questions accessed today
}

export interface ProblemHint {
  problemId: string;
  approach: string;
  strategy: string[];
  topics: string[];
  topicExplanations: { [topic: string]: string };
  thinkingProcess: string[];
}

/**
 * Get user's current progress
 */
export async function getUserProgress(userId: string): Promise<UserProgressData> {
  // Use in-memory store
  if (USE_MEMORY_STORE) {
    const progress = inMemoryStore.getUserProgress(userId);
    if (progress) {
      return progress;
    }

    // Initialize new user
    const newProgress: UserProgressData = {
      userId,
      currentRating: 800,
      completedRatings: [],
      totalQuestionsCompleted: 0,
      lastUpdated: new Date().toISOString(),
    };

    inMemoryStore.saveUserProgress(newProgress);
    console.log('✅ Initialized new user progress at rating 800 (in-memory)');
    return newProgress;
  }

  // DynamoDB fallback (has issues currently)
  try {
    const command = new GetCommand({
      TableName: USER_PROGRESS_TABLE,
      Key: { userId },
    });

    const response = await docClient.send(command);

    if (response.Item) {
      return response.Item as UserProgressData;
    }

    const newProgress: UserProgressData = {
      userId,
      currentRating: 800,
      completedRatings: [],
      totalQuestionsCompleted: 0,
      lastUpdated: new Date().toISOString(),
    };

    await saveUserProgress(newProgress);
    console.log('✅ Initialized new user progress at rating 800');
    return newProgress;
  } catch (error: any) {
    console.error('❌ Error getting user progress:', error.message);
    
    return {
      userId,
      currentRating: 800,
      completedRatings: [],
      totalQuestionsCompleted: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Save user progress
 */
export async function saveUserProgress(progress: UserProgressData): Promise<void> {
  // Use in-memory store
  if (USE_MEMORY_STORE) {
    inMemoryStore.saveUserProgress(progress);
    console.log('✅ User progress saved (in-memory):', progress.userId, 'Rating:', progress.currentRating);
    return;
  }

  // DynamoDB fallback
  try {
    const command = new PutCommand({
      TableName: USER_PROGRESS_TABLE,
      Item: {
        ...progress,
        lastUpdated: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    console.log('✅ User progress saved:', progress.userId, 'Rating:', progress.currentRating);
  } catch (error: any) {
    console.error('❌ Error saving user progress:', error.message);
  }
}

/**
 * Check if user can access a specific rating level
 */
export function canAccessRating(progress: UserProgressData, rating: number): boolean {
  // Can access current rating
  if (rating === progress.currentRating) {
    return true;
  }

  // Can access any completed rating
  if (progress.completedRatings.includes(rating)) {
    return true;
  }

  return false;
}

/**
 * Get next rating level to unlock
 */
export function getNextRating(currentRating: number): number | null {
  const currentIndex = RATING_LEVELS.indexOf(currentRating);
  if (currentIndex === -1 || currentIndex === RATING_LEVELS.length - 1) {
    return null;
  }
  return RATING_LEVELS[currentIndex + 1];
}

/**
 * Mark rating level as completed and unlock next level
 */
export async function completeRatingLevel(
  userId: string,
  rating: number
): Promise<UserProgressData> {
  try {
    const progress = await getUserProgress(userId);

    // Check if already completed
    if (progress.completedRatings.includes(rating)) {
      console.log('⚠️  Rating level already completed:', rating);
      return progress;
    }

    // Add to completed ratings
    progress.completedRatings.push(rating);

    // Unlock next rating level
    const nextRating = getNextRating(rating);
    if (nextRating) {
      progress.currentRating = nextRating;
      console.log('🔓 Unlocked next rating level:', nextRating);
    }

    await saveUserProgress(progress);
    return progress;
  } catch (error) {
    console.error('❌ Error completing rating level:', error);
    throw error;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get user's daily question access for today
 */
export async function getDailyQuestionAccess(userId: string): Promise<DailyQuestionAccess> {
  const today = getTodayDate();

  // Use in-memory store
  if (USE_MEMORY_STORE) {
    const access = inMemoryStore.getDailyAccess(userId, today);
    if (access) {
      return access;
    }

    // Initialize new daily access
    const newAccess: DailyQuestionAccess = {
      userId,
      date: today,
      questionsShown: [],
      questionsCompleted: [],
      questionsAttempted: [],
      hintsUsed: {},
      accessCount: 0,
    };

    inMemoryStore.saveDailyAccess(newAccess);
    return newAccess;
  }

  // DynamoDB fallback
  try {
    const command = new GetCommand({
      TableName: DAILY_QUESTIONS_TABLE,
      Key: { userId, date: today },
    });

    const response = await docClient.send(command);

    if (response.Item) {
      return response.Item as DailyQuestionAccess;
    }

    const newAccess: DailyQuestionAccess = {
      userId,
      date: today,
      questionsShown: [],
      questionsCompleted: [],
      questionsAttempted: [],
      hintsUsed: {},
      accessCount: 0,
    };

    await saveDailyQuestionAccess(newAccess);
    return newAccess;
  } catch (error: any) {
    console.error('❌ Error getting daily question access:', error.message);
    
    return {
      userId,
      date: today,
      questionsShown: [],
      questionsCompleted: [],
      questionsAttempted: [],
      hintsUsed: {},
      accessCount: 0,
    };
  }
}

/**
 * Save daily question access
 */
export async function saveDailyQuestionAccess(access: DailyQuestionAccess): Promise<void> {
  // Use in-memory store
  if (USE_MEMORY_STORE) {
    inMemoryStore.saveDailyAccess(access);
    return;
  }

  // DynamoDB fallback
  try {
    const command = new PutCommand({
      TableName: DAILY_QUESTIONS_TABLE,
      Item: access,
    });

    await docClient.send(command);
  } catch (error: any) {
    console.error('❌ Error saving daily question access:', error.message);
  }
}

/**
 * Check if user can access more questions today
 */
export function canAccessMoreQuestions(access: DailyQuestionAccess): boolean {
  return access.accessCount < DAILY_QUESTION_LIMIT;
}

/**
 * Get remaining questions for today
 */
export function getRemainingQuestions(access: DailyQuestionAccess): number {
  return Math.max(0, DAILY_QUESTION_LIMIT - access.accessCount);
}

/**
 * Record question access (only increments count for new questions)
 */
export async function recordQuestionAccess(
  userId: string,
  problemId: string
): Promise<DailyQuestionAccess> {
  try {
    const access = await getDailyQuestionAccess(userId);

    // Only increment count if this is a NEW question not shown before
    if (!access.questionsShown.includes(problemId)) {
      access.questionsShown.push(problemId);
      access.accessCount++;
      await saveDailyQuestionAccess(access);
      console.log('✅ Question access recorded:', problemId, 'Count:', access.accessCount);
    } else {
      console.log('ℹ️  Question already shown today:', problemId);
    }

    return access;
  } catch (error) {
    console.error('❌ Error recording question access:', error);
    throw error;
  }
}

/**
 * Record question completion
 */
export async function recordQuestionCompletion(
  userId: string,
  problemId: string
): Promise<void> {
  try {
    const access = await getDailyQuestionAccess(userId);

    if (!access.questionsCompleted.includes(problemId)) {
      access.questionsCompleted.push(problemId);
    }

    if (!access.questionsAttempted.includes(problemId)) {
      access.questionsAttempted.push(problemId);
    }

    await saveDailyQuestionAccess(access);
    console.log('✅ Question completion recorded:', problemId);
  } catch (error) {
    console.error('❌ Error recording question completion:', error);
    throw error;
  }
}

/**
 * Record hint usage
 */
export async function recordHintUsage(userId: string, problemId: string): Promise<void> {
  try {
    const access = await getDailyQuestionAccess(userId);
    access.hintsUsed[problemId] = true;
    await saveDailyQuestionAccess(access);
    console.log('💡 Hint usage recorded:', problemId);
  } catch (error) {
    console.error('❌ Error recording hint usage:', error);
    throw error;
  }
}

/**
 * Generate hint for a problem
 */
export function generateHint(problem: any): ProblemHint {
  const rating = problem.rating || 800;
  const tags = problem.tags || [];

  // Generate approach based on rating and tags
  let approach = '';
  let strategy: string[] = [];
  let topics: string[] = [];
  let topicExplanations: { [key: string]: string } = {};
  let thinkingProcess: string[] = [];

  // Determine topics from tags
  if (tags.includes('implementation')) {
    topics.push('Implementation');
    topicExplanations['Implementation'] = 'Focus on translating the problem statement directly into code. Follow the given instructions step by step.';
  }
  if (tags.includes('math')) {
    topics.push('Mathematics');
    topicExplanations['Mathematics'] = 'Look for mathematical patterns, formulas, or properties that can simplify the problem.';
  }
  if (tags.includes('greedy')) {
    topics.push('Greedy Algorithm');
    topicExplanations['Greedy Algorithm'] = 'Make the locally optimal choice at each step. Think about what decision would be best right now.';
  }
  if (tags.includes('dp') || tags.includes('dynamic programming')) {
    topics.push('Dynamic Programming');
    topicExplanations['Dynamic Programming'] = 'Break the problem into smaller subproblems. Store results to avoid recalculation.';
  }
  if (tags.includes('data structures')) {
    topics.push('Data Structures');
    topicExplanations['Data Structures'] = 'Choose the right data structure (array, map, set, etc.) to efficiently store and access data.';
  }
  if (tags.includes('strings')) {
    topics.push('String Manipulation');
    topicExplanations['String Manipulation'] = 'Use string methods like substring, indexOf, split, or character iteration.';
  }
  if (tags.includes('sortings')) {
    topics.push('Sorting');
    topicExplanations['Sorting'] = 'Consider sorting the input data first. This often simplifies the problem.';
  }
  if (tags.includes('brute force')) {
    topics.push('Brute Force');
    topicExplanations['Brute Force'] = 'Try all possible solutions systematically. Use nested loops if needed.';
  }

  // Default topics if none detected
  if (topics.length === 0) {
    topics = ['Problem Solving', 'Logic'];
    topicExplanations['Problem Solving'] = 'Read the problem carefully and identify what is being asked.';
    topicExplanations['Logic'] = 'Think through the problem step by step and identify patterns.';
  }

  // Generate strategy based on rating
  if (rating <= 900) {
    approach = 'This is a beginner-level problem. Focus on understanding the problem statement and implementing a straightforward solution.';
    strategy = [
      'Read the problem statement carefully',
      'Identify the input and output format',
      'Think about the simplest way to solve it',
      'Write clean, readable code',
      'Test with the given examples',
    ];
    thinkingProcess = [
      'What is the problem asking me to do?',
      'What variables do I need to store the data?',
      'What operations do I need to perform?',
      'How can I structure my code logically?',
    ];
  } else if (rating <= 1200) {
    approach = 'This problem requires understanding of basic algorithms and data structures. Think about efficient ways to process the data.';
    strategy = [
      'Analyze the problem constraints',
      'Choose appropriate data structures',
      'Consider edge cases',
      'Optimize your approach if needed',
      'Verify with multiple test cases',
    ];
    thinkingProcess = [
      'What is the most efficient way to solve this?',
      'Are there any patterns I can exploit?',
      'What edge cases should I handle?',
      'Can I optimize my solution further?',
    ];
  } else {
    approach = 'This is an advanced problem. You may need to apply algorithmic techniques and optimize for time/space complexity.';
    strategy = [
      'Break down the problem into subproblems',
      'Identify the algorithmic approach needed',
      'Consider time and space complexity',
      'Implement and optimize',
      'Handle all edge cases thoroughly',
    ];
    thinkingProcess = [
      'What algorithmic technique applies here?',
      'How can I optimize the time complexity?',
      'Are there any mathematical insights?',
      'What are the tricky edge cases?',
    ];
  }

  return {
    problemId: problem.problem_id || problem.id,
    approach,
    strategy,
    topics,
    topicExplanations,
    thinkingProcess,
  };
}

export default {
  getUserProgress,
  saveUserProgress,
  canAccessRating,
  getNextRating,
  completeRatingLevel,
  getDailyQuestionAccess,
  canAccessMoreQuestions,
  getRemainingQuestions,
  recordQuestionAccess,
  recordQuestionCompletion,
  recordHintUsage,
  generateHint,
  RATING_LEVELS,
  DAILY_QUESTION_LIMIT,
};
