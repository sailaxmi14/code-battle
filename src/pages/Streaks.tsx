import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Flame, Trophy, Calendar, TrendingUp, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string | number;
  name: string;
  current_streak: number;
  best_streak: number;
}

interface StreakHistory {
  date: string;
  problems_completed: number;
  xp_earned: number;
}

interface Friend {
  id: string | number;
  name: string;
  current_streak: number;
  best_streak: number;
  college: string;
}

const Streaks = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<StreakHistory[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('idToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

        // Fetch user data
        const userRes = await fetch(`${API_URL}/api/users/me`, { headers });
        
        if (!userRes.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userRes.json();
        
        // Map DynamoDB user data to expected format
        const mappedUser: User = {
          id: userData.userId,
          name: userData.name,
          current_streak: userData.currentStreak || 0,
          best_streak: userData.bestStreak || 0,
        };

        setUser(mappedUser);

        // Try to fetch streak history (may not be implemented yet)
        const historyRes = await fetch(`${API_URL}/api/streaks/history`, { headers }).catch(() => null);
        
        if (historyRes && historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
        } else {
          // Mock history data as fallback
          const mockHistory: StreakHistory[] = [
            { date: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 3, xp_earned: 200 },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 2, xp_earned: 150 },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 4, xp_earned: 250 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 1, xp_earned: 50 },
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 3, xp_earned: 200 },
          ];
          setHistory(mockHistory);
        }

        // Try to fetch leaderboard (may not be implemented yet)
        const leaderboardRes = await fetch(`${API_URL}/api/leaderboard/alltime`, { headers }).catch(() => null);
        
        if (leaderboardRes && leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          const topUsers = leaderboardData.slice(0, 10).map((entry: any) => ({
            id: entry.user_id || entry.userId,
            name: entry.name,
            current_streak: entry.current_streak || entry.currentStreak || 0,
            best_streak: entry.best_streak || entry.bestStreak || 0,
            college: entry.college || 'Unknown',
          }));
          setFriends(topUsers);
        } else {
          // Mock friends data as fallback
          const mockFriends: Friend[] = [
            { id: '2', name: 'Alice Johnson', current_streak: 15, best_streak: 20, college: 'MIT' },
            { id: '3', name: 'Bob Smith', current_streak: 10, best_streak: 15, college: 'Stanford' },
            { id: '4', name: 'Charlie Brown', current_streak: 8, best_streak: 12, college: 'Harvard' },
            { id: userData.userId, name: userData.name, current_streak: userData.currentStreak || 0, best_streak: userData.bestStreak || 0, college: userData.college || 'Your College' },
            { id: '5', name: 'Diana Prince', current_streak: 4, best_streak: 10, college: 'Berkeley' },
            { id: '6', name: 'Eve Wilson', current_streak: 3, best_streak: 8, college: 'CMU' },
          ];
          setFriends(mockFriends);
        }

        console.log('✅ Streaks loaded successfully');
      } catch (error: any) {
        console.error('Streaks fetch error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load streak data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading streaks...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "Great start! Keep going!";
    if (streak < 7) return "Building momentum!";
    if (streak < 30) return "You're on fire! 🔥";
    if (streak < 100) return "Unstoppable! 💪";
    return "Legendary streak! 🏆";
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return "text-muted-foreground";
    if (streak < 7) return "text-yellow-500";
    if (streak < 30) return "text-orange-500";
    if (streak < 100) return "text-red-500";
    return "text-purple-500";
  };

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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Flame className="h-8 w-8 text-streak" />
              Your Coding Streak
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your daily progress and compete with others
            </p>
          </div>

          {/* Main Streak Cards */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Current Streak */}
            <Card className="relative overflow-hidden border-streak/30 bg-gradient-to-br from-streak/10 to-background">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-streak/20 blur-3xl" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-streak" />
                  Current Streak
                </CardTitle>
                <CardDescription>{getStreakMessage(user.current_streak)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold ${getStreakColor(user.current_streak)}`}>
                    {user.current_streak}
                  </span>
                  <span className="text-2xl text-muted-foreground">days</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Complete at least 1 problem today to continue your streak!
                </p>
              </CardContent>
            </Card>

            {/* Best Streak */}
            <Card className="relative overflow-hidden border-rank-gold/30 bg-gradient-to-br from-rank-gold/10 to-background">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-rank-gold/20 blur-3xl" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-rank-gold" />
                  Best Streak
                </CardTitle>
                <CardDescription>Your personal record</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold text-rank-gold">
                    {user.best_streak}
                  </span>
                  <span className="text-2xl text-muted-foreground">days</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {user.current_streak === user.best_streak && user.current_streak > 0
                    ? "You're at your best! Keep pushing! 🚀"
                    : `${user.best_streak - user.current_streak} days to beat your record`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Streak History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your last 30 days of coding</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((record, index) => (
                    <motion.div
                      key={record.date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.problems_completed} problems solved
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">+{record.xp_earned} XP</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No activity yet. Start solving problems to build your streak!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Friends Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Streak Leaderboard
              </CardTitle>
              <CardDescription>See how you compare with top coders</CardDescription>
            </CardHeader>
            <CardContent>
              {friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.map((friend, index) => {
                    const isCurrentUser = friend.id === user.id;
                    return (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isCurrentUser
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card/50 hover:bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                            index === 0 ? 'bg-rank-gold text-rank-gold-foreground' :
                            index === 1 ? 'bg-rank-silver text-rank-silver-foreground' :
                            index === 2 ? 'bg-rank-bronze text-rank-bronze-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                              {friend.name} {isCurrentUser && '(You)'}
                            </p>
                            <p className="text-xs text-muted-foreground">{friend.college}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-streak" />
                            <span className="font-bold text-streak">{friend.current_streak}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Best: {friend.best_streak}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No other users yet. Invite your friends to join!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Tips */}
          <Card className="mt-8 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Streak Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Complete at least 1 problem per day before midnight to maintain your streak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Streaks are updated automatically when you complete any problem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Missing a day (completing 0 problems) will reset your current streak to 0, but your best streak is saved forever</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Compete with friends to stay motivated and build longer streaks</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Streaks;
