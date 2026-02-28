"use client";

import { useState } from "react";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { useAuthor } from "@/hooks/use-author";
import { useTranscribeAudio } from "@/lib/api/hooks/use-voice-builder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "@/components/shared/audio-recorder";
import { apiCall } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { FileText, Mic, Link2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SourceInputProps {
  onSubmit: () => void;
  isLoading: boolean;
}

export function SourceInput({ onSubmit, isLoading }: SourceInputProps) {
  const { state, setRawInput } = usePipeline();
  const { author } = useAuthor();
  const transcribe = useTranscribeAudio();
  const [activeTab, setActiveTab] = useState("text");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  if (!state.strategy) return null;

  const canSubmit = state.rawInput.trim().length > 0 && !isLoading;

  // YouTube strategy — simple URL input (no tabs)
  if (state.strategy === "YouTube") {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            YouTube URL
          </label>
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={state.rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <SubmitButton
          canSubmit={canSubmit}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </div>
    );
  }

  // Market Analysis — simple textarea (no tabs)
  if (state.strategy === "MarketAnalysis") {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Market topic or industry to analyze
          </label>
          <Textarea
            placeholder="e.g. AI adoption challenges in enterprise B2B SaaS..."
            value={state.rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            disabled={isLoading}
            rows={4}
          />
        </div>
        <SubmitButton
          canSubmit={canSubmit}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </div>
    );
  }

  // Raw Idea (linkedin_posts) — tabbed input with Text, Voice, URL
  async function handleAudioRecorded(blob: Blob) {
    if (!author) return;
    transcribe.mutate(
      { audioBlob: blob, userId: author.user_id },
      {
        onSuccess: (data) => {
          setRawInput(data.transcript);
          setActiveTab("text");
          toast.success("Recording transcribed");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Transcription failed"
          );
        },
      }
    );
  }

  async function handleScrapeUrl() {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const result = await apiCall<{ content: string; title?: string }>(
        "/v1/url-scraper",
        { url: scrapeUrl.trim() },
        session.access_token
      );
      setRawInput(result.content || "");
      setActiveTab("text");
      toast.success("URL content extracted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to scrape URL"
      );
    } finally {
      setIsScraping(false);
    }
  }

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="text" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Text
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5">
            <Mic className="h-3.5 w-3.5" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Your idea, insight, or topic
            </label>
            <Textarea
              placeholder="e.g. Why most thought leaders fail at consistency..."
              value={state.rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>
        </TabsContent>

        <TabsContent value="voice" className="mt-3">
          <AudioRecorder
            onRecordingComplete={handleAudioRecorded}
            isTranscribing={transcribe.isPending}
            submitLabel="Transcribe Recording"
          />
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <div className="space-y-2">
            <label className="text-sm font-medium mb-1.5 block">
              URL to scrape
            </label>
            <Input
              type="url"
              placeholder="https://example.com/article..."
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              disabled={isScraping}
            />
            <Button
              onClick={handleScrapeUrl}
              disabled={!scrapeUrl.trim() || isScraping}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isScraping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              {isScraping ? "Scraping..." : "Extract Content"}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              The system will scrape the page content and use it as your starting input.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {activeTab !== "voice" && (
        <SubmitButton
          canSubmit={canSubmit}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

function SubmitButton({
  canSubmit,
  isLoading,
  onSubmit,
}: {
  canSubmit: boolean;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  return (
    <Button onClick={onSubmit} disabled={!canSubmit} className="gap-2">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {isLoading ? "Generating Angles..." : "Generate Angles"}
    </Button>
  );
}
