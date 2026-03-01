"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Package,
  Activity,
  ArrowRight,
  Search,
  Mic,
  Layers,
  Users,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import { usePackets } from "@/lib/api/hooks/use-authority";
import { AuthorityScore } from "@/components/command-center/authority-score";
import { PacketHealthSummary } from "@/components/authority/packet-health-summary";

export default function AuthorityOverviewPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data: packets, isLoading: packetsLoading } = usePackets(author?.id);

  const isLoading = authorLoading || packetsLoading;

  const totalPackets = packets?.summary.total ?? 0;
  const completePackets = packets?.summary.complete ?? 0;
  const avgCoherence = packets?.packets.length
    ? Math.round(
        (packets.packets.reduce((sum, p) => sum + p.coherence_score, 0) /
          packets.packets.length) *
          100
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Authority Engine</h1>
        <AuthorSelector />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {author && <AuthorityScore authorId={author.id} />}

          {/* Quick-action navigation cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Voice Builder", desc: "Build and refine your voice DNA", href: "/voice", icon: Mic },
              { title: "Frameworks", desc: "Manage your signature methodologies", href: "/authority/frameworks", icon: Layers },
              { title: "Target Audience", desc: "Define and refine your ICPs", href: "/authority/icps", icon: Users },
            ].map((card) => (
              <Link key={card.href} href={card.href}>
                <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <card.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{card.title}</p>
                        <p className="text-xs text-muted-foreground">{card.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick stats from packets only (no expensive gap analysis) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Packets</p>
                    <p className="text-2xl font-bold tabular-nums">{totalPackets}</p>
                    <p className="text-[10px] text-muted-foreground">{completePackets} complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Coherence</p>
                    <p className="text-2xl font-bold tabular-nums">{avgCoherence}%</p>
                    <p className="text-[10px] text-muted-foreground">
                      {avgCoherence >= 70 ? "Healthy" : "Needs attention"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gap Analysis</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-sm" asChild>
                      <Link href="/authority/gaps">
                        View Analysis <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                    <p className="text-[10px] text-muted-foreground">
                      Runs on the dedicated page
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PacketHealthSummary packets={packets} />

            {/* Gap Analysis summary card — links to dedicated page */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Gap Analysis</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                    <Link href="/authority/gaps">
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Gap analysis identifies weak packets, missing DNA elements, and
                  prioritizes actions to strengthen your authority positioning.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/authority/gaps">
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Run Gap Analysis
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
