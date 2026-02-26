import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

export default function GapsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gap Analysis</h1>
        <Badge variant="outline">Phase 4</Badge>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Gap Analysis Dashboard</CardTitle>
          <CardDescription>
            See DNA utilization, prioritized actions grouped by Quick Wins /
            Strategic / Polish, and discover potential new themes. Coming in
            Phase 4.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
