import { Check, ExternalLink, Clock, Zap, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProblemCardProps {
  id: number;
  problemId: string; // DynamoDB questionId
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  platform: string;
  completed: boolean;
  xpReward: number;
  problemUrl: string;
  onComplete?: () => void;
}

const difficultyStyles = {
  Easy: "bg-success/15 text-success border-success/30",
  Medium: "bg-accent/15 text-accent border-accent/30",
  Hard: "bg-destructive/15 text-destructive border-destructive/30",
};

const ProblemCard = ({ id, problemId, title, difficulty, platform, completed, xpReward, problemUrl, onComplete }: ProblemCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [codeforcesHandle, setCodeforcesHandle] = useState("");
  const [savedHandle, setSavedHandle] = useState<string | null>(null);
  const [isLoadingHandle, setIsLoadingHandle] = useState(false);
  const { toast } = useToast();

  // Fetch saved Codeforces handle when component mounts
  const fetchSavedHandle = async () => {
    try {
      setIsLoadingHandle(true);
      const token = localStorage.getItem('idToken');
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.codeforcesHandle) {
          setSavedHandle(userData.codeforcesHandle);
          setCodeforcesHandle(userData.codeforcesHandle);
        }
      }
    } catch (error) {
      console.error('Failed to fetch saved handle:', error);
    } finally {
      setIsLoadingHandle(false);
    }
  };

  useEffect(() => {
    fetchSavedHandle();
  }, []);

  const handleVerify = async () => {
    if (!codeforcesHandle.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Codeforces username",
        variant: "destructive",
      });
      return;
    }

    // Check if user entered an email instead of username
    if (codeforcesHandle.includes('@')) {
      toast({
        title: "Invalid Input",
        description: "Please enter your Codeforces username, not email. Your username is visible on your Codeforces profile page.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem('idToken');
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/codeforces-problems/verify/${problemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ codeforcesHandle: codeforcesHandle.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      const result = await response.json();

      if (result.verified) {
        // Update saved handle state if this was first time
        if (!savedHandle) {
          setSavedHandle(codeforcesHandle.trim());
        }
        
        toast({
          title: "Problem Verified! 🎉",
          description: `You earned ${result.xpEarned} XP! Current streak: ${result.currentStreak} days`,
        });
        
        setShowVerifyDialog(false);
        if (onComplete) {
          onComplete();
        }
      } else {
        toast({
          title: "Not Verified",
          description: result.message || "No successful submission found. Make sure you've solved this problem on Codeforces.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify problem",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSolve = () => {
    window.open(problemUrl, '_blank', 'noopener,noreferrer');
  };

  const handleMarkComplete = async () => {
    if (completed) return;
    
    setIsCompleting(true);
    try {
      const token = localStorage.getItem('idToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/problems/${problemId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ submission_url: problemUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark problem as complete');
      }

      const result = await response.json();
      
      toast({
        title: "Problem Completed! 🎉",
        description: `You earned ${result.xpEarned} XP! Current streak: ${result.currentStreak} days`,
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark problem as complete",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all ${
        completed
          ? "border-success/30 bg-success/5"
          : "border-border bg-gradient-card hover:border-primary/30 hover:shadow-neon-primary"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${difficultyStyles[difficulty]}`}>
              {difficulty}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{platform}</span>
          </div>
          <h4 className="font-medium truncate">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-xp" />
            +{xpReward} XP
          </p>
        </div>
        {completed ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/20">
            <Check className="h-5 w-5 text-success" />
          </div>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Button 
              size="sm" 
              variant="ghost" 
              className="gap-1 text-muted-foreground hover:text-primary"
              onClick={handleSolve}
            >
              <ExternalLink className="h-4 w-4" />
              Solve
            </Button>
            {platform === 'Codeforces' ? (
              <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="gap-1"
                  >
                    <Search className="h-4 w-4" />
                    Check
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Verify Codeforces Submission</DialogTitle>
                    <DialogDescription>
                      {savedHandle 
                        ? `Verifying with your saved handle: ${savedHandle}`
                        : 'Enter your Codeforces username to verify if you\'ve solved this problem'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="handle">Codeforces Username</Label>
                      <Input
                        id="handle"
                        placeholder="e.g., tourist"
                        value={codeforcesHandle}
                        onChange={(e) => setCodeforcesHandle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleVerify();
                          }
                        }}
                        disabled={isLoadingHandle}
                      />
                      <p className="text-xs text-muted-foreground">
                        {savedHandle 
                          ? 'Your Codeforces username is saved. You can change it in Profile settings.'
                          : 'Enter your Codeforces username (case-sensitive). This will be saved for future verifications.'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: Use your Codeforces username/handle, not email. Find it at codeforces.com/profile/[your-username]
                      </p>
                    </div>
                    <Button 
                      onClick={handleVerify} 
                      disabled={isVerifying || isLoadingHandle}
                      className="w-full"
                    >
                      {isVerifying ? 'Verifying...' : isLoadingHandle ? 'Loading...' : 'Verify Submission'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button 
                size="sm" 
                variant="default" 
                className="gap-1"
                onClick={handleMarkComplete}
                disabled={isCompleting}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isCompleting ? 'Marking...' : 'Complete'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemCard;
