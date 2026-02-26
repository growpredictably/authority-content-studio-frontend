import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";

export default function VoiceBuilderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mic className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Voice Builder</h1>
        <Badge variant="outline">Phase 5</Badge>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Voice DNA Builder</CardTitle>
          <CardDescription>
            Record audio, upload files, paste text, or provide YouTube URLs to
            mine your voice DNA. Includes extraction review before committing.
            Coming in Phase 5.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
