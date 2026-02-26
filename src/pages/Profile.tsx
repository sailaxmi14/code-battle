import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Flame, Trophy, Code, Edit, Zap, Calendar, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";

interface User {
  id: string | number;
  name: string;
  email: string;
  college?: string;
  level: string;
  xp: number;
  current_streak: number;
  best_streak: number;
  total_problems_solved: number;
}

interface StreakHistory {
  date: string;
  problems_completed: number;
  xp_earned: number;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<StreakHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('idToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch user data
        const userRes = await fetch('http://localhost:3001/api/users/me', { headers });
        
        if (!userRes.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userRes.json();
        
        // Map DynamoDB user data to expected format
        const mappedUser: User = {
          id: userData.userId,
          email: userData.email,
          name: userData.name,
          college: userData.college,
          level: userData.level || 'Bronze I',
          xp: userData.xp || 0,
          current_streak: userData.currentStreak || 0,
          best_streak: userData.bestStreak || 0,
          total_problems_solved: userData.totalProblemsSolved || 0,
        };

        setUser(mappedUser);
        setEditName(mappedUser.name);
        setEditCollege(mappedUser.college || "");

        // Try to fetch history
        const historyRes = await fetch('http://localhost:3001/api/streaks/history', { headers }).catch(() => null);
        
        if (historyRes && historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
        } else {
          // Mock history data as fallback
          const mockHistory: StreakHistory[] = [
            { date: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 3, xp_earned: 200 },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 2, xp_earned: 150 },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 3, xp_earned: 250 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 1, xp_earned: 50 },
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 3, xp_earned: 200 },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 2, xp_earned: 100 },
            { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), problems_completed: 3, xp_earned: 200 },
          ];
          setHistory(mockHistory);
        }

        console.log('✅ Profile loaded successfully');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, authUser]);

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('idToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch('http://localhost:3001/api/users/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: editName,
          college: editCollege,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Map response to expected format
      setUser({
        ...user!,
        name: updatedUser.name,
        college: updatedUser.college,
      });
      
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const getLevelColor = (level: string) => {
    if (level.includes("Legendary")) return "border-rank-legendary/30 bg-rank-legendary/10 text-rank-legendary";
    if (level.includes("Platinum")) return "border-rank-platinum/30 bg-rank-platinum/10 text-rank-platinum";
    if (level.includes("Gold")) return "border-rank-gold/30 bg-rank-gold/10 text-rank-gold";
    if (level.includes("Silver")) return "border-rank-silver/30 bg-rank-silver/10 text-rank-silver";
    return "border-rank-bronze/30 bg-rank-bronze/10 text-rank-bronze";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { label: "Problems Solved", value: user.total_problems_solved.toString(), icon: Code },
    { label: "Current Streak", value: `${user.current_streak} days`, icon: Flame },
    { label: "Best Streak", value: `${user.best_streak} days`, icon: Trophy },
    { label: "Total XP", value: user.xp.toLocaleString(), icon: Zap },
  ];

  const recentActivity = history.slice(0, 7).map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    problems: 3,
    completed: day.problems_completed,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-gradient-card p-8 shadow-card">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-streak/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-cta text-3xl font-bold text-primary-foreground shadow-neon-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-muted-foreground text-sm">{user.college || "No college specified"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${getLevelColor(user.level)}`}>
                    {user.level}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-streak/30 bg-streak/10 px-5 py-3">
                  <Flame className="h-8 w-8 text-streak animate-flame" />
                  <div>
                    <p className="text-2xl font-bold text-streak">{user.current_streak}</p>
                    <p className="text-xs text-muted-foreground">day streak</p>
                  </div>
                </div>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="college">College</Label>
                        <Input
                          id="college"
                          value={editCollege}
                          onChange={(e) => setEditCollege(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleUpdateProfile} className="w-full">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsChangingPassword(true)}
                >
                  <Lock className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
                <stat.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Activity Heatmap */}
          <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Recent Activity</h2>
            </div>
            {recentActivity.length > 0 ? (
              <div className="grid gap-2">
                {recentActivity.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-muted-foreground font-mono">{day.date}</span>
                    <div className="flex-1 flex gap-1.5">
                      {Array.from({ length: day.problems }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-6 flex-1 rounded ${
                            i < day.completed ? "bg-gradient-xp" : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {day.completed}/{day.problems}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity history yet. Start solving problems!
              </div>
            )}
          </div>
        </motion.div>
      </main>
      
      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={isChangingPassword} 
        onOpenChange={setIsChangingPassword} 
      />
    </div>
  );
};

export default Profile;
