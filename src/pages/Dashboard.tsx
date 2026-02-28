import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Target, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ProblemCard from "@/components/ProblemCard";

interface Problem {
  id: number;
  problem_id: string; // DynamoDB questionId
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  platform: string;
  completed: boolean;
  xp_reward: number;
  problem_url: string;
}

const Dashboard = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
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
        const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        
        // Fetch user data and today's problems from Codeforces
        const [userRes, problemsRes] = await Promise.all([
          fetch(`${API_URL}/api/users/me`, { headers }),
          fetch(`${API_URL}/api/codeforces-problems/daily`, { headers }).catch(() => null),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          // User data is available in authUser from context
        }

        // If problems endpoint works, use real data
        if (problemsRes && problemsRes.ok) {
          const problemsData = await problemsRes.json();
          setProblems(problemsData);
        } else {
          // Fallback to mock data if backend doesn't have problems yet
          const mockProblems: Problem[] = [
            {
              id: 1,
              problem_id: 'mock_1',
              title: 'Two Sum',
              difficulty: 'Easy',
              platform: 'LeetCode',
              completed: false,
              xp_reward: 50,
              problem_url: 'https://leetcode.com/problems/two-sum/',
            },
            {
              id: 2,
              problem_id: 'mock_2',
              title: 'Valid Parentheses',
              difficulty: 'Easy',
              platform: 'LeetCode',
              completed: false,
              xp_reward: 50,
              problem_url: 'https://leetcode.com/problems/valid-parentheses/',
            },
            {
              id: 3,
              problem_id: 'mock_3',
              title: 'Merge Two Sorted Lists',
              difficulty: 'Medium',
              platform: 'LeetCode',
              completed: false,
              xp_reward: 100,
              problem_url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
            },
            {
              id: 4,
              problem_id: 'mock_4',
              title: 'Binary Tree Inorder Traversal',
              difficulty: 'Easy',
              platform: 'LeetCode',
              completed: false,
              xp_reward: 50,
              problem_url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/',
            },
            {
              id: 5,
              problem_id: 'mock_5',
              title: 'Maximum Subarray',
              difficulty: 'Medium',
              platform: 'LeetCode',
              completed: false,
              xp_reward: 100,
              problem_url: 'https://leetcode.com/problems/maximum-subarray/',
            },
          ];
          setProblems(mockProblems);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const completedCount = problems.filter((p) => p.completed).length;
  const totalCount = problems.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="text-gradient-primary">{authUser?.name || 'User'}</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your daily progress and solve problems
            </p>
          </div>

          {/* Today's Completed Count */}
          <div className="mb-8">
            <div className="rounded-xl border border-border bg-gradient-card p-8 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold">Problems Completed Today</h2>
                  </div>
                  <p className="text-muted-foreground">Keep up the great work!</p>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-bold text-gradient-primary">
                    {completedCount}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">out of {totalCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Problems */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Today's Problems</h2>
            </div>
            <div className="grid gap-3">
              {problems.map((problem) => (
                <ProblemCard 
                  key={problem.id} 
                  id={problem.id}
                  problemId={problem.problem_id}
                  title={problem.title}
                  difficulty={problem.difficulty}
                  platform={problem.platform}
                  completed={problem.completed}
                  xpReward={problem.xp_reward} 
                  problemUrl={problem.problem_url}
                  onComplete={() => {
                    // Update local state
                    setProblems(prev => 
                      prev.map(p => p.id === problem.id ? { ...p, completed: true } : p)
                    );
                    toast({
                      title: "Problem Completed!",
                      description: `You earned ${problem.xp_reward} XP`,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
