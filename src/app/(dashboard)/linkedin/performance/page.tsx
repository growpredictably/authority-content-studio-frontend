import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export default function PerformancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">LinkedIn Performance</h1>
        <Badge variant="outline">Coming Soon</Badge>
      </div>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Track impressions, engagement, and follower growth across your
            LinkedIn content. See which authority angles and constraint types
            drive the most impact.
          </p>
          <div className="text-left text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">What you&apos;ll see:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Impressions, reactions, and comments per post</li>
              <li>Top-performing constraint types and angle styles</li>
              <li>Engagement trends over time</li>
              <li>Correlation between Authority Score and content performance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
