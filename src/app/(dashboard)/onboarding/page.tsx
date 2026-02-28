"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Rocket,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { OnboardingStatus, OnboardingStep } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

function StepCard({
  step,
  index,
  onComplete,
}: {
  step: OnboardingStep;
  index: number;
  onComplete: (key: string) => void;
}) {
  const done = !!step.completed_at;

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border p-4 transition-all",
        done
          ? "bg-muted/30 border-green-200"
          : "bg-card hover:shadow-md hover:border-primary/30"
      )}
    >
      <div className="shrink-0 mt-0.5">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-[10px] font-bold text-muted-foreground">
            {index + 1}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-medium text-sm",
            done && "text-muted-foreground line-through"
          )}
        >
          {step.label}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {step.description}
        </p>
      </div>
      {!done ? (
        <Link
          href={step.href}
          onClick={() => onComplete(step.step_key)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          Start
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : (
        <span className="text-[10px] text-green-600 shrink-0">Done</span>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const token = await getToken();
      const data = await apiGet<OnboardingStatus>(
        "/v1/onboarding/status",
        token
      );
      setStatus(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleComplete(stepKey: string) {
    try {
      const token = await getToken();
      await apiCall("/v1/onboarding/complete", { step_key: stepKey }, token);
    } catch {
      // Fire-and-forget — the step page is the real value
    }
  }

  const completionPercent = status?.completion_percent ?? 0;
  const allDone = completionPercent === 100;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Rocket className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Get Started</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Complete these steps to set up your authority engine. Each one unlocks
        more powerful content generation.
      </p>

      {/* ─── Progress Bar ───────────────────────────────────── */}
      {!loading && status && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {status.completed_count} of {status.total_steps} steps complete
            </span>
            <span className="text-sm font-bold text-primary">
              {completionPercent}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {allDone && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 font-medium">
              <Sparkles className="h-4 w-4" />
              You&apos;re all set! Your authority engine is fully configured.
            </div>
          )}
        </div>
      )}

      {/* ─── Steps ──────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="space-y-2.5">
          {(status?.steps || []).map((step, idx) => (
            <StepCard
              key={step.step_key}
              step={step}
              index={idx}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* ─── Skip link ──────────────────────────────────────── */}
      {!allDone && !loading && (
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now — go to Command Center
          </Link>
        </div>
      )}
    </div>
  );
}
