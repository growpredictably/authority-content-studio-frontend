"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Scan } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ParsedLinkedInProfile } from "@/lib/api/types";

interface SectionViewerProps {
  profile: ParsedLinkedInProfile;
  onScanSection: (sectionName: string) => void;
  activeScanSection?: string;
}

function SectionCard({
  title,
  sectionName,
  content,
  onScan,
  isActive,
  badge,
}: {
  title: string;
  sectionName: string;
  content: string;
  onScan: () => void;
  isActive: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Card className={cn(isActive && "ring-2 ring-primary")}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      !open && "-rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {badge && (
                <Badge variant="outline" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={onScan}
              className="gap-1"
            >
              <Scan className="h-3 w-3" />
              {isActive ? "Scanning..." : "Scan"}
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {content || "No content found for this section."}
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function SectionViewer({
  profile,
  onScanSection,
  activeScanSection,
}: SectionViewerProps) {
  return (
    <div className="space-y-3">
      {profile.headline && (
        <SectionCard
          title="Headline"
          sectionName="headline"
          content={profile.headline}
          onScan={() => onScanSection("headline")}
          isActive={activeScanSection === "headline"}
        />
      )}

      {profile.about && (
        <SectionCard
          title="About"
          sectionName="about"
          content={profile.about}
          onScan={() => onScanSection("about")}
          isActive={activeScanSection === "about"}
        />
      )}

      {profile.experiences.map((exp) => {
        const sectionName = `experience:${exp.title}`;
        return (
          <SectionCard
            key={exp.id}
            title={`${exp.title} at ${exp.company}`}
            sectionName={sectionName}
            content={exp.description}
            onScan={() => onScanSection(sectionName)}
            isActive={activeScanSection === sectionName}
            badge={exp.status === "archive" ? "Legacy" : undefined}
          />
        );
      })}

      {profile.skills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
              <Button
                variant={
                  activeScanSection === "skills" ? "default" : "outline"
                }
                size="sm"
                onClick={() => onScanSection("skills")}
                className="gap-1"
              >
                <Scan className="h-3 w-3" />
                {activeScanSection === "skills" ? "Scanning..." : "Scan"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
