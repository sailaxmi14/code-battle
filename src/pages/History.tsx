import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ExternalLink, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  userId: string;
  problemId: string;
  problemTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  solvedAt: number;
  xpEarned: number;
  platform?: string;
  submissionUrl?: string;
}

interface Stats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  totalXP: number;
}

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "Easy" | "Medium" | "Hard">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('idToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

        // Fetch from BOTH old history API and new solved-problems API
        const [oldHistoryRes, newHistoryRes, oldStatsRes, newStatsRes] = await Promise.all([
          fetch(`${API_URL}/api/history`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/solved-problems`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/history/stats`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/solved-problems/stats`, { headers }).catch(() => null),
        ]);

        // Combine old and new history
        let allProblems: HistoryItem[] = [];
        const problemIds = new Set<string>();

        // Add old history (from UserProgress table)
        if (oldHistoryRes && oldHistoryRes.ok) {
          const oldData = await oldHistoryRes.json();
          const oldProblems = (Array.isArray(oldData) ? oldData : []).map((item: any) => ({
            userId: '',
            problemId: item.problem_id || String(item.id),
            problemTitle: item.title,
            difficulty: item.difficulty,
            solvedAt: new Date(item.completed_at).getTime(),
            xpEarned: item.xp_reward,
            platform: item.platform,
            submissionUrl: item.submission_url,
          }));
          
          oldProblems.forEach((p: HistoryItem) => {
            if (!problemIds.has(p.problemId)) {
              allProblems.push(p);
              problemIds.add(p.problemId);
            }
          });
        }

        // Add new history (from SolvedProblems table)
        if (newHistoryRes && newHistoryRes.ok) {
          const newData = await newHistoryRes.json();
          const newProblems = newData.problems || [];
          
          newProblems.forEach((p: HistoryItem) => {
            if (!problemIds.has(p.problemId)) {
              allProblems.push(p);
              problemIds.add(p.problemId);
            }
          });
        }

        // Sort by latest first
        allProblems.sort((a, b) => b.solvedAt - a.solvedAt);
        setHistory(allProblems);

        // Combine stats from both sources
        let combinedStats = {
          total: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          totalXP: 0,
        };

        // Add old stats
        if (oldStatsRes && oldStatsRes.ok) {
          const oldStatsData = await oldStatsRes.json();
          const oldStats = oldStatsData?.overall || {};
          combinedStats.total += oldStats.total_completed || 0;
          combinedStats.easy += oldStats.easy_completed || 0;
          combinedStats.medium += oldStats.medium_completed || 0;
          combinedStats.hard += oldStats.hard_completed || 0;
          combinedStats.totalXP += oldStats.total_xp_earned || 0;
        }

        // Add new stats (but avoid double counting)
        if (newStatsRes && newStatsRes.ok) {
          const newStatsData = await newStatsRes.json();
          const newStats = newStatsData.stats || {};
          
          // Only add new stats if they're not already counted in old stats
          // Use the actual combined history count to be accurate
          combinedStats.total = allProblems.length;
          combinedStats.easy = allProblems.filter(p => p.difficulty === 'Easy').length;
          combinedStats.medium = allProblems.filter(p => p.difficulty === 'Medium' || p.difficulty === 'Moderate').length;
          combinedStats.hard = allProblems.filter(p => p.difficulty === 'Hard').length;
          combinedStats.totalXP = allProblems.reduce((sum, p) => sum + p.xpEarned, 0);
        }

        setStats(combinedStats);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load history",
          variant: "destructive",
        });
        setHistory([]);
        setStats({
          total: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          totalXP: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [toast]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-success/20 text-success border-success/30";
      case "Medium": 
      case "Moderate": return "bg-accent/20 text-accent border-accent/30";
      case "Hard": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-secondary";
    }
  };

  const filteredHistory = filter === "all" 
    ? history 
    : history.filter(item => {
        // Handle both "Medium" and "Moderate" for medium difficulty
        if (filter === "Medium") {
          return item.difficulty === "Medium" || item.difficulty === "Moderate";
        }
        return item.difficulty === filter;
      });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-8">
            Problem <span className="text-gradient-primary">History</span>
          </h1>

          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground mb-1">Total Solved</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground mb-1">Total XP</p>
                <p className="text-3xl font-bold">{stats.totalXP}</p>
              </div>
              <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground mb-1">By Difficulty</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-success/20 text-success">{stats.easy}E</span>
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">{stats.medium}M</span>
                  <span className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive">{stats.hard}H</span>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground mb-1">Average XP</p>
                <p className="text-3xl font-bold">{stats.total > 0 ? Math.round(stats.totalXP / stats.total) : 0}</p>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "Easy" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("Easy")}
            >
              Easy
            </Button>
            <Button
              variant={filter === "Medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("Medium")}
            >
              Medium
            </Button>
            <Button
              variant={filter === "Hard" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("Hard")}
            >
              Hard
            </Button>
          </div>

          {/* History List */}
          {filteredHistory.length > 0 ? (
            <div className="space-y-3">
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={`${item.problemId}-${item.solvedAt}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-border bg-gradient-card p-4 shadow-card hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <h3 className="font-semibold">{item.problemTitle}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                          {item.difficulty}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.solvedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-primary font-medium">+{item.xpEarned} XP</span>
                        {item.platform && <span className="text-muted-foreground">• {item.platform}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.submissionUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={item.submissionUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-border bg-gradient-card">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <Clock className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {filter === "all" 
                    ? "No Problems Solved Yet"
                    : `No ${filter} Problems Solved Yet`
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {filter === "all" 
                    ? "Start solving problems to build your history and track your progress!"
                    : `Try solving some ${filter} problems to see them here.`
                  }
                </p>
                <Button
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default History;
