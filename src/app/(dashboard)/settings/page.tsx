import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
        <Badge variant="outline">Phase 6</Badge>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account, team members, model preferences, and
            multi-author profiles. Coming in Phase 6.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
