import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

export default function DraftsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-6 w-6" />
        <h1 className="text-2xl font-bold">My Drafts</h1>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Content Drafts</CardTitle>
          <CardDescription>
            View and resume your in-progress content. All drafts from the
            content pipeline will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
