"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Rocket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  User,
  Target,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall } from "@/lib/api/client";
import { useBrands } from "@/lib/api/hooks/use-brands";
import { cn } from "@/lib/utils";
import type {
  OnboardingStatus,
  OnboardingStep,
  OnboardingSetupRequest,
  OnboardingSetupResponse,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Onboarding Wizard (new users with no brands) ──────────────

function BrandOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Company brand
  const [companyName, setCompanyName] = useState("");
  const [companyTagline, setCompanyTagline] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Step 2: Voice profile
  const [voiceName, setVoiceName] = useState("");
  const [voiceRole, setVoiceRole] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");

  // Step 3: ICP (optional)
  const [icpName, setIcpName] = useState("");
  const [icpDemographics, setIcpDemographics] = useState("");
  const [icpFrustrations, setIcpFrustrations] = useState("");
  const [icpAspirations, setIcpAspirations] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const payload: OnboardingSetupRequest = {
        company_name: companyName,
        company_tagline: companyTagline || undefined,
        company_description: companyDescription || undefined,
        company_website_url: companyWebsite || undefined,
        voice_name: voiceName,
        voice_role: voiceRole || undefined,
        voice_description: voiceDescription || undefined,
        icp_name: icpName || undefined,
        icp_demographics: icpDemographics || undefined,
        icp_frustrations: icpFrustrations || undefined,
        icp_aspirations: icpAspirations || undefined,
      };
      await apiCall<OnboardingSetupResponse>(
        "/v1/onboarding/setup",
        payload as unknown as Record<string, unknown>,
        token
      );
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Setup failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvanceStep1 = companyName.trim().length > 0;
  const canAdvanceStep2 = voiceName.trim().length > 0;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Rocket className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Welcome! Let&apos;s get set up.</h1>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step > s
                  ? "bg-green-500 text-white"
                  : step === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded transition-colors",
                  step > s ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Company Brand */}
      {step === 1 && (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Step 1: Your Company or Brand
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Grow Predictably"
              />
            </div>
            <div>
              <Label htmlFor="company-tagline">Tagline</Label>
              <Input
                id="company-tagline"
                value={companyTagline}
                onChange={(e) => setCompanyTagline(e.target.value)}
                placeholder="e.g., B2B Growth Strategy"
              />
            </div>
            <div>
              <Label htmlFor="company-desc">Description</Label>
              <Textarea
                id="company-desc"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="What does your company do?"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!canAdvanceStep1}
              className="gap-1"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Voice Profile */}
      {step === 2 && (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4" />
            Step 2: Your Voice Profile
          </div>
          <p className="text-xs text-muted-foreground">
            This is the person whose voice the AI will learn and write as.
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="voice-name">Your Name *</Label>
              <Input
                id="voice-name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="e.g., Brian Shelton"
              />
            </div>
            <div>
              <Label htmlFor="voice-role">Role / Title</Label>
              <Input
                id="voice-role"
                value={voiceRole}
                onChange={(e) => setVoiceRole(e.target.value)}
                placeholder="e.g., CEO & Co-Founder"
              />
            </div>
            <div>
              <Label htmlFor="voice-desc">Short Bio</Label>
              <Textarea
                id="voice-desc"
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                placeholder="A brief description of who you are and what you're known for"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canAdvanceStep2}
              className="gap-1"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: ICP (Optional) */}
      {step === 3 && (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Target className="h-4 w-4" />
            Step 3: Ideal Customer Profile (Optional)
          </div>
          <p className="text-xs text-muted-foreground">
            Describe who your content is for. You can skip this and add it later.
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="icp-name">ICP Name</Label>
              <Input
                id="icp-name"
                value={icpName}
                onChange={(e) => setIcpName(e.target.value)}
                placeholder="e.g., B2B SaaS Founders"
              />
            </div>
            <div>
              <Label htmlFor="icp-demographics">Demographics</Label>
              <Input
                id="icp-demographics"
                value={icpDemographics}
                onChange={(e) => setIcpDemographics(e.target.value)}
                placeholder="e.g., Tech founders, 30-50, Series A-B"
              />
            </div>
            <div>
              <Label htmlFor="icp-frustrations">Frustrations</Label>
              <Textarea
                id="icp-frustrations"
                value={icpFrustrations}
                onChange={(e) => setIcpFrustrations(e.target.value)}
                placeholder="What keeps them up at night?"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="icp-aspirations">Aspirations</Label>
              <Textarea
                id="icp-aspirations"
                value={icpAspirations}
                onChange={(e) => setIcpAspirations(e.target.value)}
                placeholder="What do they want to achieve?"
                rows={2}
              />
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              {!icpName && (
                <Button variant="outline" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Skip & Finish"
                  )}
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={submitting} className="gap-1">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Finish Setup
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onboarding Checklist (existing users) ──────────────────────

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

function OnboardingChecklist() {
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

// ─── Main Page ──────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: brandsData, isLoading: brandsLoading } = useBrands();

  // While checking brands, show loading skeleton
  if (brandsLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // No brands → show wizard to create Identity Triplet
  const hasBrands = (brandsData?.brands?.length ?? 0) > 0;
  if (!hasBrands) {
    return <BrandOnboardingWizard />;
  }

  // Has brands → show the existing onboarding checklist
  return <OnboardingChecklist />;
}
