"use client";

import { useEffect, useState } from "react";
import { apiGetPublic } from "@/lib/api/client";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
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
  Radar,
  Users,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { AuthorityScore } from "@/components/command-center/authority-score";
import { QuickStats } from "@/components/command-center/quick-stats";
import { DailySyncCards } from "@/components/command-center/daily-sync-cards";
import { AssetLeverageCard } from "@/components/command-center/asset-leverage-card";
import { ActiveRadarCard } from "@/components/command-center/active-radar-card";
import { SavedItemsDrawer } from "@/components/command-center/saved-items-drawer";

const quickLinks = [
  {
    label: "Write a Post",
    description: "Generate angles, outlines, and posts using your voice",
    href: "/content/angles",
    icon: PenTool,
    accent: "text-blue-600",
  },
  {
    label: "Scan for Evidence",
    description: "Find stats, studies, and expert opinions from the web",
    href: "/authority/evidence",
    icon: Radar,
    accent: "text-violet-600",
  },
  {
    label: "Review ICPs",
    description: "Check your ideal customer profiles and their pains",
    href: "/authority/icps",
    icon: Users,
    accent: "text-emerald-600",
  },
  {
    label: "Profile Optimizer",
    description: "Optimize your LinkedIn presence with AI suggestions",
    href: "/optimizer",
    icon: Sparkles,
    accent: "text-amber-600",
  },
  {
    label: "Authority Packets",
    description: "Manage your authority packet inventory",
    href: "/authority/packets",
    icon: Package,
    accent: "text-pink-600",
  },
  {
    label: "Gap Analysis",
    description: "Find and fill gaps in your authority positioning",
    href: "/authority/gaps",
    icon: Target,
    accent: "text-red-600",
  },
  {
    label: "Voice Builder",
    description: "Build and refine your unique voice profile",
    href: "/voice",
    icon: Mic,
    accent: "text-cyan-600",
  },
  {
    label: "Brain Builder",
    description: "Curate external knowledge and build your brain",
    href: "/brain",
    icon: Brain,
    accent: "text-orange-600",
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
            <AuthorSelector />
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading
              ? "Loading..."
              : author
                ? `Welcome back, ${author.name}`
                : "Welcome to Authority Content Studio"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {author && <SavedItemsDrawer authorId={author.id} />}
          <BackendStatus />
        </div>
      </div>

      {author ? (
        <>
          {/* Authority Readiness Score */}
          <AuthorityScore authorId={author.id} />

          {/* Quick Stats Row */}
          <QuickStats authorId={author.id} />

          {/* Asset Leverage */}
          <AssetLeverageCard authorId={author.id} />

          {/* Daily Sync Cards */}
          <DailySyncCards authorId={author.id} />

          {/* Active Radar */}
          <ActiveRadarCard authorId={author.id} />
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <link.icon className={`h-4 w-4 ${link.accent} group-hover:scale-110 transition-transform`} />
                    {link.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
