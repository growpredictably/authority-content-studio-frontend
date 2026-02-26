"use client";

import { useEffect, useState } from "react";
import { apiGetPublic } from "@/lib/api/client";
import { useAuthor } from "@/hooks/use-author";
import type { HealthResponse } from "@/lib/api/types";
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
  LayoutDashboard,
  Sparkles,
  PenTool,
  Package,
  Target,
  Mic,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { AuthorityScore } from "@/components/command-center/authority-score";
import { QuickStats } from "@/components/command-center/quick-stats";
import { DailySyncCards } from "@/components/command-center/daily-sync-cards";

const quickLinks = [
  {
    label: "Optimizer",
    description: "Optimize your LinkedIn presence",
    href: "/optimizer",
    icon: Sparkles,
    phase: 1,
  },
  {
    label: "Content Pipeline",
    description: "Generate angles, outlines, and posts",
    href: "/content/angles",
    icon: PenTool,
    phase: 3,
  },
  {
    label: "Authority Packets",
    description: "Manage your authority packet inventory",
    href: "/authority/packets",
    icon: Package,
    phase: 4,
  },
  {
    label: "Gap Analysis",
    description: "Find and fill gaps in your authority",
    href: "/authority/gaps",
    icon: Target,
    phase: 4,
  },
  {
    label: "Voice Builder",
    description: "Build and refine your voice DNA",
    href: "/voice",
    icon: Mic,
    phase: 5,
  },
  {
    label: "Brain Builder",
    description: "Curate external knowledge",
    href: "/brain",
    icon: Brain,
    phase: 5,
  },
];

function BackendStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">(
    "loading"
  );
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    apiGetPublic<HealthResponse>("/health")
      .then((data) => {
        setStatus("connected");
        setVersion(data.version);
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  if (status === "loading") {
    return <Skeleton className="h-6 w-32" />;
  }

  return (
    <Badge variant={status === "connected" ? "default" : "destructive"}>
      {status === "connected"
        ? `Backend Connected (v${version})`
        : "Backend Disconnected"}
    </Badge>
  );
}

export default function CommandCenterPage() {
  const { author, isLoading } = useAuthor();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading
              ? "Loading..."
              : author
                ? `Welcome back, ${author.name}`
                : "Welcome to Authority Content Studio"}
          </p>
        </div>
        <BackendStatus />
      </div>

      {author ? (
        <>
          {/* Authority Readiness Score */}
          <AuthorityScore authorId={author.id} />

          {/* Quick Stats Row */}
          <QuickStats authorId={author.id} />

          {/* Daily Sync Cards */}
          <DailySyncCards authorId={author.id} />
        </>
      ) : (
        !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Complete your DNA profile to unlock the Command Center
                dashboard.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-xs">
                  Phase {link.phase}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
