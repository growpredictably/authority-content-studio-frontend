import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

export default function PacketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Authority Packets</h1>
        <Badge variant="outline">Phase 4</Badge>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Packet Inventory</CardTitle>
          <CardDescription>
            View, sort, and manage your Authority Packets with coherence scores
            and smart topic-based sorting. Coming in Phase 4.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
