import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Lightbulb, ExternalLink, Calendar, Trophy, Target, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

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

interface Hint {
  problemId: string;
  topics: string[];
  approach: string;
  keyIdea: string;
  thinkingProcess: string[];
}

interface LevelProgress {
  solved: number;
  total: number;
  unlocked: boolean;
}

const Dashboard = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState<Hint | null>(null);
  const [hintProblemTitle, setHintProblemTitle] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [userCodeforcesHandle, setUserCodeforcesHandle] = useState<string>("");
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

  const fetchDailyProblems = async () => {
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/difficulty/daily-problems`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        setCurrentLevel(data.currentLevel || 'Basic');
        setLevelProgress(data.progress || null);
        
        // Set completed problems from API response
        const completedIds = data.questions
          .filter((q: Question & { completed?: boolean }) => q.completed)
          .map((q: Question) => q.id);
        setCompletedToday(new Set(completedIds));
        
        console.log('✅ Daily problems loaded:', data);
        console.log('✅ Completed problems:', completedIds);
      }
    } catch (error) {
      console.error('Error fetching daily problems:', error);
      toast({
        title: "Error",
        description: "Failed to load today's problems",
        variant: "destructive",
      });
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUserCodeforcesHandle(userData.codeforcesHandle || "");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchHint = async (problemId: string, problemTitle: string) => {
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/difficulty/hint/${problemId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedHint(data.hint);
        setHintProblemTitle(problemTitle);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to get hint",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching hint:', error);
      toast({
        title: "Error",
        description: "Failed to get hint",
        variant: "destructive",
      });
    }
  };

  const verifyProblem = async (problemId: string) => {
    // Check if Codeforces handle exists
    if (!userCodeforcesHandle) {
      toast({
        title: "Codeforces Handle Required",
        description: "Redirecting to profile page to add your handle...",
      });
      
      // Redirect to profile page after 1 second
      setTimeout(() => {
        navigate('/profile', { state: { highlightCodeforcesHandle: true } });
      }, 1000);
      return;
    }

    setVerifying(problemId);
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/difficulty/complete/${encodeURIComponent(currentLevel)}/${problemId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ codeforcesHandle: userCodeforcesHandle }),
        }
      );

      const data = await response.json();

      if (data.verified) {
        // Mark as completed
        setCompletedToday(prev => new Set([...prev, problemId]));

        // Show celebration if level unlocked
        if (data.levelUnlocked && data.unlockedLevel) {
          setCelebrationMessage(`🎉 Congratulations! ${data.unlockedLevel} Level Unlocked!`);
          setShowCelebration(true);
        }

        toast({
          title: data.levelUnlocked ? "🎉 Level Unlocked!" : "✅ Solution Verified!",
          description: data.message || "Your solution has been accepted on Codeforces!",
        });

        // Refresh data
        await fetchDailyProblems();
      } else {
        toast({
          title: "Not Verified",
          description: data.message || "You have not successfully submitted the solution yet. Please solve the problem on Codeforces first.",
        });
      }
    } catch (error: any) {
      console.error('Error verifying problem:', error);
      
      // Handle different error types
      if (error.message?.includes('Network')) {
        toast({
          title: "Connection Error",
          description: "Please check your internet connection and try again.",
        });
      } else if (error.message?.includes('timeout')) {
        toast({
          title: "Request Timeout",
          description: "The verification is taking too long. Please try again.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Unable to verify your solution. Please try again later.",
        });
      }
    } finally {
      setVerifying(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDailyProblems(), fetchUserProfile()]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading today's problems...</p>
        </div>
      </div>
    );
  }

  const completedCount = completedToday.size;
  const totalCount = questions.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">
                Today's <span className="text-gradient-primary">Problems</span>
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Complete your daily coding practice • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Current Level: {currentLevel}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {levelProgress && `${levelProgress.solved} / 51 problems completed in this level`}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {completedCount} / {totalCount} Today
                </Badge>
              </div>
            </CardHeader>
            {levelProgress && (
              <CardContent>
                <Progress value={(levelProgress.solved / 51) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {51 - levelProgress.solved} more to unlock next level
                </p>
              </CardContent>
            )}
          </Card>

          {/* Problems List */}
          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Problems Available</h3>
                <p className="text-muted-foreground">
                  Check back later for today's problems
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => {
                const isCompleted = completedToday.has(question.id);
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      className={`transition-all hover:shadow-md ${
                        isCompleted ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="pt-1">
                            {isCompleted ? (
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Problem Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <CardTitle className={`text-xl ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                  {index + 1}. {question.title}
                                </CardTitle>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="font-mono">
                                    Rating: {question.rating}
                                  </Badge>
                                  {question.tags.slice(0, 4).map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {isCompleted && (
                                <Badge className="bg-green-500 shrink-0">
                                  Completed ✓
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex gap-2 ml-10 flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchHint(question.id, question.title)}
                            disabled={isCompleted}
                          >
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Hint
                          </Button>
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
                            onClick={() => verifyProblem(question.id)}
                            disabled={isCompleted || verifying === question.id}
                            className={isCompleted ? 'bg-green-500 hover:bg-green-600' : ''}
                          >
                            {verifying === question.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : isCompleted ? (
                              'Verified'
                            ) : (
                              'Check'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Completion Message */}
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="mt-8 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="py-8 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-2xl font-bold mb-2">Great Job!</h3>
                  <p className="text-lg text-muted-foreground">
                    You've completed all of today's problems. Come back tomorrow for more!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Hint Dialog */}
      <Dialog open={!!selectedHint} onOpenChange={() => setSelectedHint(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Hint: {hintProblemTitle}
            </DialogTitle>
            <DialogDescription>
              Conceptual guidance to help you solve the problem
            </DialogDescription>
          </DialogHeader>

          {selectedHint && (
            <div className="space-y-6">
              {/* Topics */}
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  🎯 Topics Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedHint.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-sm">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Approach */}
              <div>
                <h3 className="font-semibold text-lg mb-2">💡 Approach</h3>
                <p className="text-muted-foreground">{selectedHint.approach}</p>
              </div>

              {/* Key Idea */}
              <div>
                <h3 className="font-semibold text-lg mb-2">🔑 Key Idea</h3>
                <p className="text-muted-foreground">{selectedHint.keyIdea}</p>
              </div>

              {/* Thinking Process */}
              <div>
                <h3 className="font-semibold text-lg mb-2">🤔 Questions to Ask Yourself</h3>
                <ul className="list-disc list-inside space-y-2">
                  {selectedHint.thinkingProcess.map((question, index) => (
                    <li key={index} className="text-muted-foreground">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              fetchDailyProblems();
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

export default Dashboard;
