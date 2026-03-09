import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Lock, Unlock, CheckCircle2, Trophy, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface LevelProgress {
  solved: number;
  total: number;
  unlocked: boolean;
}

interface DifficultyProgress {
  currentLevel: string;
  unlockedLevels: string[];
  progressByLevel: {
    [key: string]: LevelProgress;
  };
  summary: {
    currentLevel: string;
    unlockedLevels: string[];
    currentProgress: {
      solved: number;
      required: number;
      remaining: number;
      percentage: number;
    };
    nextLevel: string | null;
    canUnlockNext: boolean;
    allLevels: Array<{
      name: string;
      unlocked: boolean;
      solved: number;
      total: number;
      progress: number;
    }>;
  };
}

interface Question {
  id: string;
  title: string;
  rating: number;
  tags: string[];
  problem_url: string;
  difficulty: string;
  contest_id?: number;
  problem_index?: string;
}

const DIFFICULTY_LEVELS = ['Basic', 'Easy', 'Medium', 'Hard', 'Difficult'];
const UNLOCK_REQUIREMENT = 51;

const LEVEL_COLORS: { [key: string]: string } = {
  'Basic': 'from-green-500 to-emerald-600',
  'Easy': 'from-blue-500 to-cyan-600',
  'Medium': 'from-yellow-500 to-orange-600',
  'Hard': 'from-red-500 to-pink-600',
  'Difficult': 'from-purple-500 to-indigo-600',
};

const LEVEL_DESCRIPTIONS: { [key: string]: string } = {
  'Basic': 'Perfect for beginners. Start your coding journey here!',
  'Easy': 'Build confidence with fundamental problem-solving.',
  'Medium': 'Challenge yourself with intermediate concepts.',
  'Hard': 'Advanced problems for experienced coders.',
  'Difficult': 'Master level challenges for experts.',
};

const Levels = () => {
  const [progress, setProgress] = useState<DifficultyProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

  // Generate Codeforces submit URL
  const getSubmitUrl = (question: Question): string | null => {
    // Extract contest ID and problem index from question ID or metadata
    let contestId = question.contest_id;
    let problemIndex = question.problem_index;

    // If not in metadata, try to extract from ID (format: CF-{contestId}-{index})
    if (!contestId || !problemIndex) {
      const parts = question.id.split('-');
      if (parts.length === 3 && parts[0] === 'CF') {
        contestId = parseInt(parts[1]);
        problemIndex = parts[2];
      }
    }

    // Validate
    if (!contestId || !problemIndex || isNaN(contestId)) {
      console.error('Invalid problem data for submit URL:', question);
      return null;
    }

    return `https://codeforces.com/problemset/submit/${contestId}/${problemIndex}`;
  };

  // Handle solve button click - opens problem page in new tab
  const handleSolveClick = (question: Question) => {
    // Ensure we have valid problem data
    const contestId = question.contest_id;
    const problemIndex = question.problem_index;
    
    // Build the correct Codeforces URL
    let problemUrl = question.problem_url;
    
    // If we have contestId and problemIndex, use the standard format
    if (contestId && problemIndex) {
      problemUrl = `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`;
    }
    
    // Open in new tab with proper attributes
    window.open(problemUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Problem Opened",
      description: "Solve on Codeforces, then click the Submit button there. Come back and click 'Check' to verify.",
    });
  };

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/difficulty/progress`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        console.log('✅ Progress loaded:', data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchQuestions = async (level: string) => {
    setLoadingQuestions(true);
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/difficulty/questions/${encodeURIComponent(level)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        console.log(`✅ Loaded ${data.questions?.length || 0} questions for ${level}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || error.error || "Failed to load questions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const verifyProblem = async (level: string, questionId: string) => {
    if (!user?.codeforcesHandle) {
      toast({
        title: "Codeforces Handle Required",
        description: "Please add your Codeforces handle in your profile",
        variant: "destructive",
      });
      return;
    }

    setVerifying(questionId);
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/difficulty/complete/${encodeURIComponent(level)}/${questionId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ codeforcesHandle: user.codeforcesHandle }),
        }
      );

      const data = await response.json();

      if (data.verified) {
        // Show celebration if level unlocked
        if (data.levelUnlocked && data.unlockedLevel) {
          setCelebrationMessage(`🎉 Congratulations! ${data.unlockedLevel} Level Unlocked!`);
          setShowCelebration(true);
        }

        toast({
          title: data.levelUnlocked ? "🎉 Level Unlocked!" : "✅ Solution Verified!",
          description: data.message || "Your solution has been accepted on Codeforces!",
        });

        // Refresh progress
        await fetchProgress();
      } else {
        toast({
          title: "Not Verified",
          description: data.message || "You have not successfully submitted the solution yet. Please solve the problem on Codeforces first.",
        });
      }
    } catch (error) {
      console.error('Error verifying problem:', error);
      toast({
        title: "Error",
        description: "Failed to verify problem",
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  const handleLevelClick = (level: string, unlocked: boolean) => {
    if (!unlocked) {
      const levelIndex = DIFFICULTY_LEVELS.indexOf(level);
      const previousLevel = levelIndex > 0 ? DIFFICULTY_LEVELS[levelIndex - 1] : null;
      toast({
        title: "🔒 Level Locked",
        description: previousLevel
          ? `Solve ${UNLOCK_REQUIREMENT} ${previousLevel} questions to unlock ${level} level.`
          : "This level is locked.",
      });
      return;
    }

    setSelectedLevel(level);
    fetchQuestions(level);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProgress();
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Difficulty <span className="text-gradient-primary">Levels</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Progress through structured difficulty levels. Solve 51 questions to unlock the next level.
            </p>
          </div>

          {/* Current Progress Banner */}
          {progress?.summary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mb-8 border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-primary" />
                        Current Level: {progress.summary.currentLevel}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        {progress.summary.currentProgress.remaining > 0
                          ? `${progress.summary.currentProgress.remaining} more questions to unlock ${progress.summary.nextLevel || 'completion'}`
                          : progress.summary.nextLevel
                          ? `Ready to unlock ${progress.summary.nextLevel}!`
                          : 'All levels completed! 🎉'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {progress.summary.currentProgress.solved} / {UNLOCK_REQUIREMENT}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={progress.summary.currentProgress.percentage} 
                    className="h-4"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-right">
                    {Math.round(progress.summary.currentProgress.percentage)}% Complete
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Difficulty Levels Grid */}
          {!selectedLevel && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {progress?.summary.allLevels.map((level, index) => {
                const isUnlocked = level.unlocked;
                const isCurrent = progress.currentLevel === level.name;
                const progressPercentage = (level.solved / UNLOCK_REQUIREMENT) * 100;
                const isCompleted = level.solved >= UNLOCK_REQUIREMENT;

                return (
                  <motion.div
                    key={level.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={isUnlocked ? { scale: 1.03, y: -5 } : {}}
                    whileTap={isUnlocked ? { scale: 0.98 } : {}}
                  >
                    <Card
                      className={`cursor-pointer transition-all h-full ${
                        isCurrent ? 'border-2 border-primary shadow-xl' : 'border-2'
                      } ${!isUnlocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'}`}
                      onClick={() => handleLevelClick(level.name, isUnlocked)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className={`p-3 rounded-lg bg-gradient-to-br ${LEVEL_COLORS[level.name]}`}>
                            {isUnlocked ? (
                              <Unlock className="h-6 w-6 text-white" />
                            ) : (
                              <Lock className="h-6 w-6 text-white" />
                            )}
                          </div>
                          {isCurrent && (
                            <Badge className="bg-primary">Current</Badge>
                          )}
                          {isCompleted && !isCurrent && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl">{level.name}</CardTitle>
                        <CardDescription className="text-base">
                          {LEVEL_DESCRIPTIONS[level.name]}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress Count */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Progress
                          </span>
                          <span className="text-lg font-bold">
                            {level.solved} / {UNLOCK_REQUIREMENT}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <Progress
                            value={isUnlocked ? progressPercentage : 0}
                            className="h-3"
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {isUnlocked ? `${Math.round(progressPercentage)}%` : 'Locked'}
                          </p>
                        </div>

                        {/* Status Message */}
                        {!isUnlocked && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Solve {UNLOCK_REQUIREMENT} questions in {index > 0 ? DIFFICULTY_LEVELS[index - 1] : 'previous'} level to unlock
                            </p>
                          </div>
                        )}

                        {isUnlocked && (
                          <Button 
                            className="w-full" 
                            variant={isCurrent ? "default" : "outline"}
                          >
                            {isCurrent ? 'Continue' : 'Start'} Level
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Questions View */}
          {selectedLevel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold">{selectedLevel} Questions</h2>
                  <p className="text-muted-foreground mt-1">
                    Solve problems and verify your solutions
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLevel(null);
                    setQuestions([]);
                  }}
                >
                  Back to Levels
                </Button>
              </div>

              {loadingQuestions ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading questions...</p>
                  </CardContent>
                </Card>
              ) : questions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No questions available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {questions.map((question, index) => {
                    // Check if this problem is completed (you can track this via state or API)
                    const isCompleted = false; // TODO: Track completed problems per level
                    
                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className={`transition-all hover:shadow-md ${
                          isCompleted ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''
                        }`}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 flex items-start gap-3">
                                {/* Checkbox indicator */}
                                <div className="pt-1">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <CardTitle className={`text-lg ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                    {question.title}
                                  </CardTitle>
                                  <CardDescription className="mt-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline">Rating: {question.rating}</Badge>
                                      {question.tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardDescription>
                                </div>
                              </div>
                              {isCompleted && (
                                <Badge className="bg-green-500 shrink-0">
                                  Completed ✓
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2 flex-wrap justify-end ml-8">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSolveClick(question)}
                                disabled={isCompleted}
                                className="bg-black hover:bg-orange-500 text-white transition-colors duration-200"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Solve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => verifyProblem(selectedLevel, question.id)}
                                disabled={isCompleted || verifying === question.id}
                                className={isCompleted ? 'bg-green-500 hover:bg-green-600' : ''}
                              >
                                {verifying === question.id ? 'Verifying...' : isCompleted ? 'Verified' : 'Check'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl justify-center">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Congratulations!
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <Trophy className="h-32 w-32 text-yellow-500" />
            </motion.div>
            <DialogDescription className="text-lg text-center font-medium">
              {celebrationMessage}
            </DialogDescription>
          </div>
          <Button 
            onClick={() => {
              setShowCelebration(false);
              fetchProgress();
            }}
            className="w-full"
          >
            Continue Learning
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Levels;
