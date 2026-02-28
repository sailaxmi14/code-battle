import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/LeaderboardTable";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  rank: number;
  name: string;
  college?: string;
  level: string;
  streak?: number;
  weeklyXP?: number;
  xp?: number;
  trend?: "up" | "down" | "same";
}

const Leaderboard = () => {
  const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
  const [alltimeData, setAlltimeData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const token = localStorage.getItem('idToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

        // Fetch current user data first
        const userRes = await fetch(`${API_URL}/api/users/me`, { headers });
        let currentUserId = null;
        
        if (userRes.ok) {
          const userData = await userRes.json();
          currentUserId = userData.userId;
        }

        // Try to fetch leaderboards from backend
        const weeklyRes = await fetch(`${API_URL}/api/leaderboard/weekly`, { headers }).catch(() => null);
        const alltimeRes = await fetch(`${API_URL}/api/leaderboard/alltime`, { headers }).catch(() => null);

        if (weeklyRes && weeklyRes.ok) {
          const weekly = await weeklyRes.json();
          setWeeklyData(
            weekly.map((entry: any, index: number) => ({
              rank: entry.weekly_rank || index + 1,
              name: entry.name,
              college: entry.college,
              level: entry.level,
              streak: entry.current_streak || entry.currentStreak,
              weeklyXP: entry.weekly_xp || entry.xp,
              trend: "same" as const,
            }))
          );
        } else {
          // Mock weekly data as fallback
          const mockWeekly: LeaderboardEntry[] = [
            { rank: 1, name: 'Alice Johnson', college: 'MIT', level: 'Gold III', streak: 15, weeklyXP: 1250, trend: 'up' },
            { rank: 2, name: 'Bob Smith', college: 'Stanford', level: 'Gold II', streak: 10, weeklyXP: 1100, trend: 'up' },
            { rank: 3, name: 'Charlie Brown', college: 'Harvard', level: 'Gold I', streak: 8, weeklyXP: 950, trend: 'same' },
            { rank: 4, name: 'Test User', college: 'Your College', level: 'Silver III', streak: 5, weeklyXP: 850, trend: 'up' },
            { rank: 5, name: 'Diana Prince', college: 'Berkeley', level: 'Silver II', streak: 4, weeklyXP: 700, trend: 'down' },
            { rank: 6, name: 'Eve Wilson', college: 'CMU', level: 'Silver I', streak: 3, weeklyXP: 650, trend: 'same' },
            { rank: 7, name: 'Frank Miller', college: 'Caltech', level: 'Bronze III', streak: 2, weeklyXP: 500, trend: 'up' },
            { rank: 8, name: 'Grace Lee', college: 'Princeton', level: 'Bronze II', streak: 1, weeklyXP: 400, trend: 'same' },
          ];
          setWeeklyData(mockWeekly);
        }

        if (alltimeRes && alltimeRes.ok) {
          const alltime = await alltimeRes.json();
          setAlltimeData(
            alltime.map((entry: any, index: number) => ({
              rank: entry.rank || index + 1,
              name: entry.name,
              college: entry.college,
              level: entry.level,
              streak: entry.current_streak || entry.currentStreak,
              weeklyXP: entry.xp,
              trend: "same" as const,
            }))
          );
        } else {
          // Mock all-time data as fallback
          const mockAlltime: LeaderboardEntry[] = [
            { rank: 1, name: 'Alice Johnson', college: 'MIT', level: 'Platinum I', streak: 15, weeklyXP: 15000, trend: 'same' },
            { rank: 2, name: 'Bob Smith', college: 'Stanford', level: 'Gold III', streak: 10, weeklyXP: 12500, trend: 'same' },
            { rank: 3, name: 'Charlie Brown', college: 'Harvard', level: 'Gold II', streak: 8, weeklyXP: 10200, trend: 'up' },
            { rank: 4, name: 'Diana Prince', college: 'Berkeley', level: 'Gold I', streak: 4, weeklyXP: 8900, trend: 'down' },
            { rank: 5, name: 'Eve Wilson', college: 'CMU', level: 'Silver III', streak: 3, weeklyXP: 7500, trend: 'same' },
            { rank: 6, name: 'Test User', college: 'Your College', level: 'Silver II', streak: 5, weeklyXP: 6800, trend: 'up' },
            { rank: 7, name: 'Frank Miller', college: 'Caltech', level: 'Silver I', streak: 2, weeklyXP: 5500, trend: 'same' },
            { rank: 8, name: 'Grace Lee', college: 'Princeton', level: 'Bronze III', streak: 1, weeklyXP: 4200, trend: 'up' },
          ];
          setAlltimeData(mockAlltime);
        }

        console.log('✅ Leaderboard loaded successfully');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-rank-gold" />
            <div>
              <h1 className="text-3xl font-bold">Leaderboard</h1>
              <p className="text-muted-foreground">Compete with the best coders across India</p>
            </div>
          </div>

          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="mb-6 bg-secondary">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="alltime">All Time</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
              {weeklyData.length > 0 ? (
                <LeaderboardTable entries={weeklyData} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No leaderboard data available yet. Start solving problems to appear here!
                </div>
              )}
            </TabsContent>
            <TabsContent value="alltime">
              {alltimeData.length > 0 ? (
                <LeaderboardTable entries={alltimeData} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No leaderboard data available yet. Start solving problems to appear here!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Leaderboard;
