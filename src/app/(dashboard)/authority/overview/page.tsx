import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function AuthorityOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Authority Engine</h1>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Authority Overview</CardTitle>
          <CardDescription>
            Track your authority score trends, packet health, and gap
            completion over time. Detailed authority analytics coming soon.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
