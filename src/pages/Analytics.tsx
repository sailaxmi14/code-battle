import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Award, BarChart3, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface TopicProgress {
  topic_name: string;
  total_problems: number;
  solved_problems: number;
  success_rate: number;
}

interface Weakness {
  topic_name: string;
  weakness_score: number;
  problems_failed: number;
}

interface DifficultyProgress {
  date: string;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
}

interface Reward {
  reward_type: string;
  reward_name: string;
  reward_description: string;
  unlock_level: number;
  is_unlocked: boolean;
}

interface WeeklyReport {
  week_start_date: string;
  week_end_date: string;
  total_problems_solved: number;
  xp_earned: number;
  current_streak: number;
  topics_improved: string[];
  weak_areas: string[];
  rank_change: number;
  current_rank: number;
}

const Analytics = () => {
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [difficultyProgress, setDifficultyProgress] = useState<DifficultyProgress[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('idToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

        // Try to fetch analytics from backend
        const [topicsRes, weaknessesRes, difficultyRes, rewardsRes, reportRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/topics`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/analytics/weaknesses`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/analytics/difficulty-progress?days=30`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/analytics/rewards`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/analytics/weekly-report/latest`, { headers }).catch(() => null),
        ]);

        // Use real data if available, otherwise use mock data
        if (topicsRes && topicsRes.ok) {
          const topicsData = await topicsRes.json();
          setTopics(Array.isArray(topicsData) ? topicsData : []);
        } else {
          const mockTopics: TopicProgress[] = [
            { topic_name: 'Arrays', total_problems: 50, solved_problems: 35, success_rate: 70 },
            { topic_name: 'Strings', total_problems: 40, solved_problems: 28, success_rate: 70 },
            { topic_name: 'Linked Lists', total_problems: 30, solved_problems: 18, success_rate: 60 },
            { topic_name: 'Trees', total_problems: 45, solved_problems: 20, success_rate: 44 },
            { topic_name: 'Dynamic Programming', total_problems: 60, solved_problems: 15, success_rate: 25 },
            { topic_name: 'Graphs', total_problems: 35, solved_problems: 10, success_rate: 29 },
          ];
          setTopics(mockTopics);
        }

        if (weaknessesRes && weaknessesRes.ok) {
          const weaknessesData = await weaknessesRes.json();
          setWeaknesses(Array.isArray(weaknessesData) ? weaknessesData : []);
        } else {
          const mockWeaknesses: Weakness[] = [
            { topic_name: 'Dynamic Programming', weakness_score: 75, problems_failed: 12 },
            { topic_name: 'Graphs', weakness_score: 71, problems_failed: 8 },
            { topic_name: 'Trees', weakness_score: 56, problems_failed: 10 },
          ];
          setWeaknesses(mockWeaknesses);
        }

        if (difficultyRes && difficultyRes.ok) {
          const difficultyData = await difficultyRes.json();
          setDifficultyProgress(Array.isArray(difficultyData) ? difficultyData : []);
        } else {
          const mockDifficultyProgress: DifficultyProgress[] = [
            { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), easy_solved: 2, medium_solved: 1, hard_solved: 0 },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), easy_solved: 1, medium_solved: 2, hard_solved: 1 },
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), easy_solved: 3, medium_solved: 1, hard_solved: 0 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), easy_solved: 1, medium_solved: 1, hard_solved: 1 },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), easy_solved: 2, medium_solved: 2, hard_solved: 0 },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), easy_solved: 1, medium_solved: 1, hard_solved: 0 },
            { date: new Date().toISOString(), easy_solved: 2, medium_solved: 1, hard_solved: 0 },
          ];
          setDifficultyProgress(mockDifficultyProgress);
        }

        if (rewardsRes && rewardsRes.ok) {
          const rewardsData = await rewardsRes.json();
          setRewards(Array.isArray(rewardsData) ? rewardsData : []);
        } else {
          const mockRewards: Reward[] = [
            { reward_type: 'badge', reward_name: 'First Steps', reward_description: 'Complete your first problem', unlock_level: 1, is_unlocked: true },
            { reward_type: 'badge', reward_name: 'Week Warrior', reward_description: 'Maintain a 7-day streak', unlock_level: 5, is_unlocked: true },
            { reward_type: 'badge', reward_name: 'Problem Solver', reward_description: 'Solve 50 problems', unlock_level: 10, is_unlocked: false },
            { reward_type: 'badge', reward_name: 'Hard Mode', reward_description: 'Complete 10 hard problems', unlock_level: 15, is_unlocked: false },
            { reward_type: 'badge', reward_name: 'Streak Master', reward_description: 'Maintain a 30-day streak', unlock_level: 20, is_unlocked: false },
            { reward_type: 'badge', reward_name: 'Century Club', reward_description: 'Solve 100 problems', unlock_level: 25, is_unlocked: false },
          ];
          setRewards(mockRewards);
        }

        if (reportRes && reportRes.ok) {
          const reportData = await reportRes.json();
          setWeeklyReport(reportData);
        } else {
          const mockWeeklyReport: WeeklyReport = {
            week_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            week_end_date: new Date().toISOString(),
            total_problems_solved: 12,
            xp_earned: 850,
            current_streak: 5,
            topics_improved: ['Arrays', 'Strings', 'Linked Lists'],
            weak_areas: ['Dynamic Programming', 'Graphs'],
            rank_change: 3,
            current_rank: 42,
          };
          setWeeklyReport(mockWeeklyReport);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const unlockedRewards = rewards.filter(r => r.is_unlocked).length;
  const totalRewards = rewards.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-8">
            Performance <span className="text-gradient-primary">Analytics</span>
          </h1>

          {/* Topic Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Topic Progress</h2>
            </div>
            {topics.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {topics.map((topic) => (
                  <div key={topic.topic_name} className="rounded-xl border border-border bg-gradient-card p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{topic.topic_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {topic.solved_problems}/{topic.total_problems} ({topic.success_rate.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={topic.success_rate} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-gradient-card p-8 text-center text-muted-foreground">
                Start solving problems to see your topic progress!
              </div>
            )}
          </div>

          {/* Weak Areas */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-bold">Areas Needing Improvement</h2>
            </div>
            {weaknesses.length > 0 ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                <div className="space-y-3">
                  {weaknesses.map((weakness) => (
                    <div key={weakness.topic_name} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{weakness.topic_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {weakness.problems_failed} problems failed
                        </p>
                      </div>
                      <span className="text-sm font-bold text-destructive">
                        {weakness.weakness_score.toFixed(0)}% weak
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  💡 Tip: Focus on these topics to improve your overall performance!
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center">
                <p className="text-success font-medium">Great job! No weak areas detected. Keep it up! 🎉</p>
              </div>
            )}
          </div>

          {/* Difficulty Progression */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Difficulty Progression (Last 30 Days)</h2>
            </div>
            {difficultyProgress.length > 0 ? (
              <div className="rounded-xl border border-border bg-gradient-card p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {difficultyProgress.reduce((sum, d) => sum + d.easy_solved, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Easy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">
                      {difficultyProgress.reduce((sum, d) => sum + d.medium_solved, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Medium</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">
                      {difficultyProgress.reduce((sum, d) => sum + d.hard_solved, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Hard</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {difficultyProgress.slice(-7).reverse().map((day) => (
                    <div key={day.date} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 flex gap-1">
                        {day.easy_solved > 0 && (
                          <div className="h-6 bg-success rounded" style={{ width: `${day.easy_solved * 33}%` }} />
                        )}
                        {day.medium_solved > 0 && (
                          <div className="h-6 bg-accent rounded" style={{ width: `${day.medium_solved * 33}%` }} />
                        )}
                        {day.hard_solved > 0 && (
                          <div className="h-6 bg-destructive rounded" style={{ width: `${day.hard_solved * 33}%` }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-gradient-card p-8 text-center text-muted-foreground">
                Start solving problems to see your difficulty progression!
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Rewards & Achievements</h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {unlockedRewards}/{totalRewards} unlocked
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <div
                  key={reward.reward_name}
                  className={`rounded-lg border p-4 ${
                    reward.is_unlocked
                      ? 'border-success/30 bg-success/10'
                      : 'border-border bg-secondary/10 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{reward.reward_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {reward.reward_description}
                      </p>
                    </div>
                    <span className="text-2xl">
                      {reward.is_unlocked ? '🔓' : '🔒'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reward.is_unlocked
                      ? '✅ Unlocked'
                      : `🔒 Unlock at Level ${reward.unlock_level}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Report */}
          {weeklyReport && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Latest Weekly Report</h2>
              </div>
              <div className="rounded-xl border border-border bg-gradient-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(weeklyReport.week_start_date).toLocaleDateString()} - {new Date(weeklyReport.week_end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {weeklyReport.rank_change > 0 ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-success" />
                        <span className="text-success font-bold">+{weeklyReport.rank_change}</span>
                      </>
                    ) : weeklyReport.rank_change < 0 ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
                        <span className="text-destructive font-bold">{weeklyReport.rank_change}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No change</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Problems Solved</p>
                    <p className="text-2xl font-bold">{weeklyReport.total_problems_solved}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">XP Earned</p>
                    <p className="text-2xl font-bold">{weeklyReport.xp_earned}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">{weeklyReport.current_streak}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rank</p>
                    <p className="text-2xl font-bold">#{weeklyReport.current_rank}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Topics Improved</p>
                    <div className="flex flex-wrap gap-2">
                      {weeklyReport.topics_improved && weeklyReport.topics_improved.length > 0 ? (
                        weeklyReport.topics_improved.map((topic) => (
                          <span key={topic} className="text-xs px-2 py-1 rounded bg-success/20 text-success">
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No improvements yet</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Needs Practice</p>
                    <div className="flex flex-wrap gap-2">
                      {weeklyReport.weak_areas && weeklyReport.weak_areas.length > 0 ? (
                        weeklyReport.weak_areas.map((topic) => (
                          <span key={topic} className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive">
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No weak areas</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;
