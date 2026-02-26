import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
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
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>
            Track impressions, engagement, and follower growth across your
            LinkedIn content.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
