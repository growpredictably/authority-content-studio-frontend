"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Loader2, Hammer } from "lucide-react";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  usePackets,
  useRebuildPacket,
  useBuildAllPackets,
} from "@/lib/api/hooks/use-authority";
import { PacketCard } from "@/components/authority/packet-card";
import {
  PacketFilterBar,
  type PacketFilter,
} from "@/components/authority/packet-filter-bar";
import { PacketDetailDialog } from "@/components/authority/packet-detail-dialog";
import type { PacketResponse } from "@/lib/api/types";

export default function PacketsPage() {
  const { author } = useAuthor();
  const { data, isLoading } = usePackets(author?.id);
  const rebuildPacket = useRebuildPacket();
  const buildAll = useBuildAllPackets();

  const [filter, setFilter] = useState<PacketFilter>("all");
  const [selectedPacket, setSelectedPacket] = useState<PacketResponse | null>(
    null
  );
  const [rebuildingId, setRebuildingId] = useState<string | null>(null);

  const packets = data?.packets ?? [];

  const readyCounts = {
    ready: packets.filter((p) => p.readiness_stage === "ready").length,
    calibrating: packets.filter((p) => p.readiness_stage === "calibrating")
      .length,
    draft: packets.filter((p) => p.readiness_stage === "draft").length,
  };

  const filtered =
    filter === "all"
      ? packets
      : packets.filter((p) => p.readiness_stage === filter);

  function handleRebuild(packetId: string) {
    setRebuildingId(packetId);
    rebuildPacket.mutate(packetId, {
      onSuccess: () => {
        toast.success("Packet rebuilt successfully");
        setRebuildingId(null);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to rebuild packet"
        );
        setRebuildingId(null);
      },
    });
  }

  function handleBuildAll() {
    if (!author) return;
    buildAll.mutate(
      { author_id: author.id, brand_id: author.brand_id },
      {
        onSuccess: (res) => {
          toast.success(`Built ${res.packets_built} packets`);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to build packets"
          );
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Authority Packets</h1>
          <AuthorSelector />
        </div>
        <Button
          onClick={handleBuildAll}
          disabled={buildAll.isPending || !author}
          className="gap-2"
        >
          {buildAll.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Hammer className="h-4 w-4" />
          )}
          {buildAll.isPending ? "Building..." : "Build All"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : packets.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            No authority packets yet. Click &quot;Build All&quot; to generate
            them from your voice profile.
          </p>
        </div>
      ) : (
        <>
          <PacketFilterBar
            activeFilter={filter}
            onFilterChange={setFilter}
            summary={data!.summary}
            readyCounts={readyCounts}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((packet) => (
              <PacketCard
                key={packet.id}
                packet={packet}
                onRebuild={handleRebuild}
                onClick={setSelectedPacket}
                isRebuilding={rebuildingId === packet.id}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No packets match the selected filter.
            </p>
          )}
        </>
      )}

      <PacketDetailDialog
        packet={selectedPacket}
        authorId={author?.id ?? ""}
        open={!!selectedPacket}
        onOpenChange={(open) => !open && setSelectedPacket(null)}
      />
    </div>
  );
}
