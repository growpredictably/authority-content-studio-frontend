"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Link2, Lightbulb, Shield } from "lucide-react";
import confetti from "canvas-confetti";
import type { HabitStats, SyncAction } from "@/lib/api/types";

// ─── Identity messages by streak length ─────────────────────────────

function getIdentityMessage(streak: number): string {
  if (streak >= 30) return "Authority machine. Your DNA is compounding daily.";
  if (streak >= 15) return "This isn't a streak anymore. It's who you are.";
  if (streak >= 8) return "Two weeks strong. Your authority is compounding.";
  if (streak >= 4) return "A week of building authority. This is becoming habit.";
  if (streak >= 1) return "You're building momentum. Keep going.";
  return "First sync done. The streak starts now.";
}

// ─── Micro-Celebration (per action) ─────────────────────────────────

interface MicroCelebrationProps {
  visible: boolean;
  actionType: SyncAction["action_type"];
  message?: string;
  impactDelta?: { before: number; after: number };
  onComplete: () => void;
}

export function MicroCelebration({
  visible,
  actionType,
  message,
  impactDelta,
  onComplete,
}: MicroCelebrationProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="flex flex-col items-center justify-center py-12 gap-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          {/* Type-specific animation */}
          {actionType === "clarify" && impactDelta && (
            <motion.div
              className="flex items-center gap-2 text-amber-600"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
            >
              <Lightbulb className="h-6 w-6" />
              <span className="text-2xl font-bold tabular-nums">
                {(impactDelta.before * 100).toFixed(0)}%
              </span>
              <motion.span
                className="text-2xl font-bold text-green-600 tabular-nums"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                → {(impactDelta.after * 100).toFixed(0)}%
              </motion.span>
            </motion.div>
          )}

          {actionType === "sync" && (
            <motion.div className="flex items-center gap-3 text-blue-600">
              <motion.div
                className="h-3 w-3 rounded-full bg-blue-500"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ type: "spring" }}
              />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Link2 className="h-5 w-5" />
              </motion.div>
              <motion.div
                className="h-3 w-3 rounded-full bg-blue-500"
                initial={{ x: 20 }}
                animate={{ x: 0 }}
                transition={{ type: "spring" }}
              />
            </motion.div>
          )}

          {actionType === "decide" && (
            <motion.div
              className="flex items-center gap-2 text-purple-600"
              initial={{ rotateZ: -5 }}
              animate={{ rotateZ: 0 }}
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm font-semibold">Position locked</span>
            </motion.div>
          )}

          {/* Checkmark */}
          <motion.div
            className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Check className="h-5 w-5 text-green-600" />
          </motion.div>

          {/* Backend message */}
          {message && (
            <motion.p
              className="text-sm text-muted-foreground text-center max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Macro-Celebration (all actions complete) ───────────────────────

interface MacroCelebrationProps {
  visible: boolean;
  habitStats: HabitStats;
  scoreDelta?: number;
  onComplete: () => void;
}

export function MacroCelebration({
  visible,
  habitStats,
  scoreDelta,
  onComplete,
}: MacroCelebrationProps) {
  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#f59e0b", "#10b981", "#6366f1"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#f59e0b", "#10b981", "#6366f1"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  useEffect(() => {
    if (visible) {
      fireConfetti();
      const timer = setTimeout(onComplete, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, fireConfetti, onComplete]);

  const identityMessage = getIdentityMessage(habitStats.current_streak);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="flex flex-col items-center justify-center py-16 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Big checkmark */}
          <motion.div
            className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Check className="h-8 w-8 text-green-600" />
          </motion.div>

          <motion.h2
            className="text-xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            All 3 syncs complete!
          </motion.h2>

          {/* Identity message */}
          <motion.p
            className="text-sm text-muted-foreground text-center max-w-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {identityMessage}
          </motion.p>

          {/* Streak + score delta */}
          <motion.div
            className="flex items-center gap-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span className="flex items-center gap-1 text-orange-500 font-semibold">
              🔥 {habitStats.current_streak} day streak
            </span>
            {scoreDelta !== undefined && scoreDelta > 0 && (
              <span className="text-green-600 font-medium">
                Score +{scoreDelta.toFixed(1)}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Streak Milestone Celebration ───────────────────────────────────

const milestones = [7, 14, 30, 60, 90];
const milestoneMessages: Record<number, string> = {
  7: "1 week. Most people never get here.",
  14: "2 weeks of building authority. You're in rare company.",
  30: "30 days. This is who you are now.",
  60: "60 days. Your authority compounds while you sleep.",
  90: "90 days. You've built something most people only talk about.",
};

interface MilestoneCelebrationProps {
  streak: number;
  onComplete: () => void;
}

export function MilestoneCelebration({ streak, onComplete }: MilestoneCelebrationProps) {
  const isMilestone = milestones.includes(streak);

  useEffect(() => {
    if (isMilestone) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#eab308", "#fbbf24"],
      });
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [isMilestone, onComplete]);

  if (!isMilestone) return null;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-5xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        🏆
      </motion.div>
      <h2 className="text-lg font-bold">
        {streak}-Day Milestone!
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {milestoneMessages[streak]}
      </p>
    </motion.div>
  );
}
