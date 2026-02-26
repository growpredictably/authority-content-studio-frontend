import {
  Card,
  CardContent,
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
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <LayoutTemplate className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Content Templates</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Browse proven LinkedIn post and article templates tailored to your
            Voice DNA. Select a template, and the content pipeline will use it
            as your structural blueprint.
          </p>
          <div className="text-left text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">What you&apos;ll get:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Curated post structures (listicle, story, contrarian take, etc.)</li>
              <li>Article frameworks with section blueprints</li>
              <li>Templates auto-adapted to your Voice DNA</li>
              <li>Performance data on which structures work best for you</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
