"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plug,
  Webhook,
  Workflow,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useUserProfile } from "@/lib/api/hooks/use-user-profile";
import { useUserRole } from "@/lib/api/hooks/use-user-role";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Plug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Integrations</h1>
      </div>

      <WebhookConfigCard />
      <WebhookStatusSummary />
      <ContentStrategyCard />
      <WorkflowOverviewCard />
    </div>
  );
}

// ─── Webhook Config Card ────────────────────────────────────

function WebhookConfigCard() {
  const { data: profile, isLoading } = useUserProfile();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4" />
          <CardTitle className="text-sm">Webhook Configuration</CardTitle>
        </div>
        <CardDescription>
          Your configured webhook endpoint for receiving events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : profile?.webhook_url ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">URL</span>
              <span className="font-mono">{profile.webhook_url}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Secret</span>
              <span className="font-mono">
                {profile.webhook_secret ? "••••••••" : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Events</span>
              <div className="flex gap-1">
                {(profile.webhook_events ?? []).length > 0 ? (
                  (profile.webhook_events as string[]).map((e) => (
                    <Badge key={e} variant="outline" className="text-[9px]">
                      {e}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">All events</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No webhook configured. Configure one in Settings to receive
            real-time event notifications.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Webhook Status Summary ─────────────────────────────────

function WebhookStatusSummary() {
  const { data: profile } = useUserProfile();
  const { data: roleData } = useUserRole();

  const hasWebhook = !!profile?.webhook_url;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <CardTitle className="text-sm">Integration Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            {hasWebhook ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>Webhook Endpoint</span>
            <Badge
              variant={hasWebhook ? "default" : "outline"}
              className="text-[9px] ml-auto"
            >
              {hasWebhook ? "Connected" : "Not configured"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>Supabase Database</span>
            <Badge variant="default" className="text-[9px] ml-auto">
              Connected
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>Modal Backend</span>
            <Badge variant="default" className="text-[9px] ml-auto">
              Connected
            </Badge>
          </div>
          {roleData?.isAdmin && (
            <p className="text-muted-foreground pt-2">
              For detailed webhook health checks, visit the Admin panel.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Content Strategy Card ──────────────────────────────────

function ContentStrategyCard() {
  const strategies = [
    {
      name: "LinkedIn Posts",
      description: "Short-form authority content for LinkedIn feed",
      active: true,
    },
    {
      name: "LinkedIn Articles",
      description: "Long-form thought leadership articles",
      active: true,
    },
    {
      name: "Market Analysis",
      description: "Competitive analysis and market intelligence",
      active: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <CardTitle className="text-sm">Content Strategies</CardTitle>
        </div>
        <CardDescription>
          Available content creation strategies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {strategies.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-md border p-2 text-xs"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-muted-foreground">{s.description}</p>
              </div>
              <Badge
                variant={s.active ? "default" : "outline"}
                className="text-[9px]"
              >
                {s.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Workflow Overview Card ─────────────────────────────────

function WorkflowOverviewCard() {
  const stages = [
    { name: "Angles", description: "Generate content angles from authority DNA" },
    { name: "Outline", description: "Build structured outline with evidence" },
    { name: "Write", description: "Generate full content with voice matching" },
    { name: "Publish", description: "Finalize and track performance" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          <CardTitle className="text-sm">Workflow Pipeline</CardTitle>
        </div>
        <CardDescription>
          Visual overview of the content creation pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1">
          {stages.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-1">
              <div className="rounded-md border p-2.5 text-center min-w-[100px]">
                <p className="text-xs font-medium">{stage.name}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {stage.description}
                </p>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
