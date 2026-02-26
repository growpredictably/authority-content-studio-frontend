"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Youtube,
  Mic,
  Loader2,
} from "lucide-react";

export type VoiceSourceType = "text" | "youtube";

interface VoiceInputTabsProps {
  onSubmit: (sourceType: VoiceSourceType, content: string) => void;
  isSubmitting: boolean;
}

export function VoiceInputTabs({
  onSubmit,
  isSubmitting,
}: VoiceInputTabsProps) {
  const [textContent, setTextContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [activeTab, setActiveTab] = useState<string>("text");

  function handleSubmit() {
    if (activeTab === "text" && textContent.trim()) {
      onSubmit("text", textContent.trim());
    } else if (activeTab === "youtube" && youtubeUrl.trim()) {
      onSubmit("youtube", youtubeUrl.trim());
    }
  }

  const canSubmit =
    (activeTab === "text" && textContent.trim().length > 20) ||
    (activeTab === "youtube" && youtubeUrl.trim().length > 10);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="text" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Paste Text
        </TabsTrigger>
        <TabsTrigger value="youtube" className="gap-1.5">
          <Youtube className="h-3.5 w-3.5" />
          YouTube
        </TabsTrigger>
        <TabsTrigger value="record" className="gap-1.5" disabled>
          <Mic className="h-3.5 w-3.5" />
          Record
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="space-y-3 mt-4">
        <div className="space-y-1.5">
          <Label htmlFor="voice-text">
            Paste a transcript, blog post, interview notes, or any text that
            captures your thinking
          </Label>
          <Textarea
            id="voice-text"
            placeholder="Share your stories, beliefs, frameworks, and perspectives... The system will extract and categorize your Voice DNA elements."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={10}
            className="resize-y"
          />
          <p className="text-[10px] text-muted-foreground">
            {textContent.length > 0
              ? `${textContent.split(/\s+/).filter(Boolean).length} words`
              : "Minimum 20 characters"}
          </p>
        </div>
      </TabsContent>

      <TabsContent value="youtube" className="space-y-3 mt-4">
        <div className="space-y-1.5">
          <Label htmlFor="youtube-url">YouTube Video URL</Label>
          <Input
            id="youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            The system will transcribe the video and extract your Voice DNA
            elements.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="record" className="mt-4">
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <Mic className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Audio recording coming soon. For now, record on your phone and paste
            the transcript above.
          </p>
        </div>
      </TabsContent>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full mt-4 gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {isSubmitting ? "Mining Your DNA..." : "Mine Voice DNA"}
      </Button>
    </Tabs>
  );
}
