"use client";

import { motion } from "framer-motion";

interface CoherenceGaugeProps {
  score: number;
  size?: number;
}

function getColor(score: number): string {
  if (score < 0.4) return "#ef4444";
  if (score < 0.7) return "#f59e0b";
  return "#22c55e";
}

export function CoherenceGauge({ score, size = 80 }: CoherenceGaugeProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(score * 100);
  const color = getColor(score);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20"
          strokeWidth={4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - circumference * score,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span
        className="absolute text-xs font-semibold"
        style={{ color }}
      >
        {percent}%
      </span>
    </div>
  );
}
