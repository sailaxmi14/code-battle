import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, CheckCircle2, Trophy, Sparkles } from "lucide-react";
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

interface Question {
  id: string;
  title: string;
  rating: number;
  tags: string[];
  problem_url: string;
  difficulty: string;
}

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

const DIFFICULTY_LEVELS = ['Dead Easy', 'Easy', 'Medium', 'Hard', 'Difficult'];
const UNLOCK_REQUIREMENT = 51;

const LEVEL_COLORS = {
  'Dead Easy': 'from-green-500 to-emerald-600',
  'Easy': 'from-blue-500 to-cyan-600',
  'Medium': 'from-yellow-500 to-orange-600',
  'Hard': 'from-red-500 to-pink-600',
  'Difficult': 'from-purple-500 to-indigo-600',
};

const ProgressiveDashboard = () => {
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

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

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
          title: data.levelUnlocked ? "🎉 Level Unlocked!" : "✅ Problem Verified!",
          description: data.message,
        });

        // Refresh data
        await fetchProgress();
        if (selectedLevel) {
          await fetchQuestions(selectedLevel);
        }
      } else {
        toast({
          title: "Not Verified",
          description: data.message,
          variant: "destructive",
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
          <p className="mt-4 text-muted-foreground">Loading your learning path...</p>
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
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="text-gradient-primary">{user?.name || 'User'}</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your structured learning journey - Complete 51 questions to unlock each level
            </p>
          </div>

          {/* Current Progress Overview */}
          {progress?.summary && (
            <Card className="mb-8 border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Current Progress: {progress.summary.currentLevel}
                </CardTitle>
                <CardDescription>
                  {progress.summary.currentProgress.remaining > 0
                    ? `${progress.summary.currentProgress.remaining} more questions to unlock ${progress.summary.nextLevel || 'completion'}`
                    : progress.summary.nextLevel
                    ? `Ready to unlock ${progress.summary.nextLevel}!`
                    : 'All levels completed! 🎉'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {progress.summary.currentProgress.solved} / {UNLOCK_REQUIREMENT} solved
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(progress.summary.currentProgress.percentage)}%
                    </span>
                  </div>
                  <Progress value={progress.summary.currentProgress.percentage} className="h-3" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Difficulty Levels */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Difficulty Levels</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {progress?.summary.allLevels.map((level) => {
                const isUnlocked = level.unlocked;
                const isCurrent = progress.currentLevel === level.name;
                const progressPercentage = (level.solved / UNLOCK_REQUIREMENT) * 100;

                return (
                  <motion.div
                    key={level.name}
                    whileHover={isUnlocked ? { scale: 1.02 } : {}}
                    whileTap={isUnlocked ? { scale: 0.98 } : {}}
                  >
                    <Card
                      className={`cursor-pointer transition-all ${
                        isCurrent ? 'border-2 border-primary shadow-lg' : ''
                      } ${!isUnlocked ? 'opacity-60' : ''}`}
                      onClick={() => handleLevelClick(level.name, isUnlocked)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {isUnlocked ? (
                              <Unlock className="h-5 w-5 text-green-500" />
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                            {level.name}
                          </CardTitle>
                          {isCurrent && (
                            <Badge className="bg-primary">Current</Badge>
                          )}
                        </div>
                        <CardDescription>
                          {isUnlocked
                            ? `${level.solved} / ${UNLOCK_REQUIREMENT} solved`
                            : `🔒 Solve ${UNLOCK_REQUIREMENT} questions in previous level`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress
                          value={isUnlocked ? progressPercentage : 0}
                          className="h-2"
                        />
                        {isUnlocked && level.solved >= UNLOCK_REQUIREMENT && (
                          <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Completed!</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Questions for Selected Level */}
          {selectedLevel && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedLevel} Questions</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLevel(null);
                    setQuestions([]);
                  }}
                >
                  Close
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
                  {questions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{question.title}</CardTitle>
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
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={question.problem_url} target="_blank" rel="noopener noreferrer">
                              Open Problem
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => verifyProblem(selectedLevel, question.id)}
                            disabled={verifying === question.id}
                          >
                            {verifying === question.id ? 'Verifying...' : 'Verify Solution'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-lg pt-4">
              {celebrationMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Trophy className="h-24 w-24 text-yellow-500" />
            </motion.div>
          </div>
          <Button onClick={() => setShowCelebration(false)}>
            Continue Learning
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgressiveDashboard;
