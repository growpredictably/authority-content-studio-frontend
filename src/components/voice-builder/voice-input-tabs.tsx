"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Youtube,
  Mic,
  Link2,
  FileSpreadsheet,
  FileText as FileDocIcon,
  FileUp,
  Loader2,
} from "lucide-react";
import { AudioRecorder } from "@/components/shared/audio-recorder";

export type VoiceSourceType = "text" | "youtube" | "audio" | "url" | "gdoc" | "gsheet";

export type VoiceOwnership = "self" | "reference";

interface VoiceInputTabsProps {
  onSubmit: (sourceType: VoiceSourceType, content: string, ownership: VoiceOwnership) => void;
  isSubmitting: boolean;
  /** Called when audio is recorded and needs transcription before mining */
  onAudioRecorded?: (audioBlob: Blob, ownership: VoiceOwnership) => void;
  isTranscribing?: boolean;
  /** Called when an Excel file is uploaded */
  onExcelUpload?: (file: File) => void;
  isUploadingExcel?: boolean;
  /** Pre-fill the text tab with content (e.g. from navigation) */
  initialContent?: string;
  /** Which tab to start on (e.g. "text", "youtube") */
  initialTab?: string;
}

// ─── Main Component ───────────────────────────────────────────

export function VoiceInputTabs({
  onSubmit,
  isSubmitting,
  onAudioRecorded,
  isTranscribing,
  onExcelUpload,
  isUploadingExcel,
  initialContent,
  initialTab,
}: VoiceInputTabsProps) {
  const [textContent, setTextContent] = useState(initialContent || "");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [gdocUrl, setGdocUrl] = useState("");
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>(initialTab || "text");
  const [ownership, setOwnership] = useState<VoiceOwnership>("self");
  const excelInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (activeTab === "text" && textContent.trim()) {
      onSubmit("text", textContent.trim(), ownership);
    } else if (activeTab === "youtube" && youtubeUrl.trim()) {
      onSubmit("youtube", youtubeUrl.trim(), ownership);
    } else if (activeTab === "url" && scrapeUrl.trim()) {
      onSubmit("url", scrapeUrl.trim(), ownership);
    } else if (activeTab === "gdoc" && gdocUrl.trim()) {
      onSubmit("gdoc", gdocUrl.trim(), ownership);
    } else if (activeTab === "spreadsheet" && gsheetUrl.trim()) {
      onSubmit("gsheet", gsheetUrl.trim(), ownership);
    }
  }

  const canSubmit =
    (activeTab === "text" && textContent.trim().length > 20) ||
    (activeTab === "youtube" && youtubeUrl.trim().length > 10) ||
    (activeTab === "url" && scrapeUrl.trim().length > 10) ||
    (activeTab === "gdoc" && gdocUrl.trim().length > 10) ||
    (activeTab === "spreadsheet" && gsheetUrl.trim().length > 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Source:</span>
        <div className="inline-flex rounded-md border">
          <button
            type="button"
            onClick={() => setOwnership("self")}
            className={`px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors ${
              ownership === "self"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            My Own Content
          </button>
          <button
            type="button"
            onClick={() => setOwnership("reference")}
            className={`px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors ${
              ownership === "reference"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            Reference Material
          </button>
        </div>
        {ownership === "reference" && (
          <span className="text-[10px] text-muted-foreground">
            Elements will be tagged as external reference
          </span>
        )}
      </div>
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="flex w-full">
        <TabsTrigger value="text" className="gap-1.5 flex-1 min-w-0">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Text</span>
        </TabsTrigger>
        <TabsTrigger value="youtube" className="gap-1.5 flex-1 min-w-0">
          <Youtube className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">YouTube</span>
        </TabsTrigger>
        <TabsTrigger value="record" className="gap-1.5 flex-1 min-w-0">
          <Mic className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Record</span>
        </TabsTrigger>
        <TabsTrigger value="url" className="gap-1.5 flex-1 min-w-0">
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">URL</span>
        </TabsTrigger>
        <TabsTrigger value="gdoc" className="gap-1.5 flex-1 min-w-0">
          <FileDocIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Google Doc</span>
        </TabsTrigger>
        <TabsTrigger value="spreadsheet" className="gap-1.5 flex-1 min-w-0">
          <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Spreadsheet</span>
        </TabsTrigger>
      </TabsList>

      {/* Text Tab */}
      <TabsContent value="text" className="space-y-3 mt-4">
        <div className="space-y-1.5">
          <Label htmlFor="voice-text">
            Paste a transcript, blog post, interview notes, or any text that
            captures your thinking
          </Label>
          <Textarea
            id="voice-text"
            placeholder="Share your stories, beliefs, frameworks, and perspectives... The system will extract and categorize your voice profile elements."
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

      {/* YouTube Tab */}
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
            The system will transcribe the video and extract your voice profile elements.
          </p>
        </div>
      </TabsContent>

      {/* Record Tab */}
      <TabsContent value="record" className="mt-4">
        <AudioRecorder
          onRecordingComplete={(blob) => onAudioRecorded?.(blob, ownership)}
          isTranscribing={isTranscribing}
        />
      </TabsContent>

      {/* URL Scrape Tab */}
      <TabsContent value="url" className="space-y-3 mt-4">
        <div className="space-y-1.5">
          <Label htmlFor="scrape-url">Website or Article URL</Label>
          <Input
            id="scrape-url"
            type="url"
            placeholder="https://example.com/article-about-your-expertise"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            The system will scrape the content and extract your voice profile elements.
          </p>
        </div>
      </TabsContent>

      {/* Google Doc Tab */}
      <TabsContent value="gdoc" className="space-y-3 mt-4">
        <div className="space-y-1.5">
          <Label htmlFor="gdoc-url">Google Docs URL</Label>
          <Input
            id="gdoc-url"
            type="url"
            placeholder="https://docs.google.com/document/d/..."
            value={gdocUrl}
            onChange={(e) => setGdocUrl(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            Make sure the document is shared (anyone with the link can view).
          </p>
        </div>
      </TabsContent>

      {/* Spreadsheet Tab (Google Sheets URL or Excel Upload) */}
      <TabsContent value="spreadsheet" className="space-y-4 mt-4">
        <div className="space-y-1.5">
          <Label htmlFor="gsheet-url">Google Sheets URL</Label>
          <Input
            id="gsheet-url"
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={gsheetUrl}
            onChange={(e) => setGsheetUrl(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            Make sure the spreadsheet is shared (anyone with the link can view).
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or upload a file</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excel-upload">Excel File (.xlsx)</Label>
          <div
            className="rounded-lg border border-dashed p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => excelInputRef.current?.click()}
          >
            <input
              ref={excelInputRef}
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setExcelFile(file);
              }}
            />
            <FileUp className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
            {excelFile ? (
              <p className="text-sm font-medium">{excelFile.name}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click to select an Excel file
              </p>
            )}
          </div>
          {excelFile && (
            <Button
              onClick={() => onExcelUpload?.(excelFile)}
              disabled={isUploadingExcel}
              variant="outline"
              className="w-full gap-2"
              size="sm"
            >
              {isUploadingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isUploadingExcel ? "Uploading..." : "Upload & Process Excel"}
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground">
            Use sheets named: Tone, Stories, Quotes, Perspectives, Knowledge, Experience, Preferences.
          </p>
        </div>
      </TabsContent>

      {/* Submit button — hidden when on Record and Spreadsheet tabs (they have their own actions) */}
      {activeTab !== "record" && activeTab !== "spreadsheet" && (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full mt-4 gap-2"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Mining Your Voice..." : "Mine Voice"}
        </Button>
      )}
    </Tabs>
    </div>
  );
}
