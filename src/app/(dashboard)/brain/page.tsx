import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";

export default function BrainBuilderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Brain Builder</h1>
        <Badge variant="outline">Phase 5</Badge>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>External Knowledge Library</CardTitle>
          <CardDescription>
            Curate URLs into Strategic Knowledge Blocks, endorse with Full /
            Partial / Anti-Model / Reference levels, and scan for evidence.
            Coming in Phase 5.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
