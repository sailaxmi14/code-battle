import { Flame, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StreakCardProps {
  streak: number;
  bestStreak: number;
  timeRemaining?: number; // milliseconds until streak resets
  expiringSoon?: boolean;
}

const StreakCard = ({ streak, bestStreak, timeRemaining, expiringSoon }: StreakCardProps) => {
  const [displayTime, setDisplayTime] = useState("");
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0 || streak === 0) {
      setDisplayTime("");
      setIsExpiring(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, timeRemaining - (now - Date.now()));
      
      if (remaining <= 0) {
        setDisplayTime("Streak expired");
        setIsExpiring(false);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setDisplayTime(`${hours}h ${minutes}m ${seconds}s`);
      setIsExpiring(expiringSoon || remaining < 2 * 60 * 60 * 1000); // Less than 2 hours
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, expiringSoon, streak]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-card p-6 shadow-card">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-streak/10 blur-2xl" />
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gradient-streak">{streak}</span>
            <span className="text-lg text-muted-foreground">days</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Best: <span className="text-streak">{bestStreak} days</span>
          </p>
          {displayTime && streak > 0 && (
            <div className={`mt-3 flex items-center gap-1.5 text-xs ${isExpiring ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>
                {isExpiring ? '⚠️ ' : ''}
                {displayTime} remaining
              </span>
            </div>
          )}
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame 
            className={`h-16 w-16 drop-shadow-lg ${isExpiring ? 'text-destructive' : 'text-streak'}`} 
            style={{ filter: isExpiring ? "drop-shadow(0 0 12px hsl(0 84% 60% / 0.5))" : "drop-shadow(0 0 12px hsl(25 95% 55% / 0.5))" }} 
          />
        </motion.div>
      </div>
    </div>
  );
};

export default StreakCard;
