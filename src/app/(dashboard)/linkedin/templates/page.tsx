import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-6 w-6" />
        <h1 className="text-2xl font-bold">LinkedIn Templates</h1>
        <Badge variant="outline">Coming Soon</Badge>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Content Templates</CardTitle>
          <CardDescription>
            Browse and customize proven LinkedIn post and article templates
            tailored to your voice DNA.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
