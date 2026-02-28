"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import { useDriftScan } from "@/lib/api/hooks/use-optimizer";
import { LinkedInUploader } from "@/components/optimizer/linkedin-uploader";
import { SectionViewer } from "@/components/optimizer/section-viewer";
import { DriftScanForm } from "@/components/optimizer/drift-scan-form";
import { DriftScanResults } from "@/components/optimizer/drift-scan-results";
import { BrandMapper } from "@/components/optimizer/brand-mapper";
import type {
  ParsedLinkedInProfile,
  DriftScanRequest,
  SuggestResponse,
} from "@/lib/api/types";
import { toast } from "sonner";

export default function OptimizerPage() {
  const { author } = useAuthor();
  const [profile, setProfile] = useState<ParsedLinkedInProfile | null>(null);
  const [activeSection, setActiveSection] = useState<string | undefined>();
  const [scanResults, setScanResults] = useState<SuggestResponse | null>(null);

  const driftScan = useDriftScan();

  function handleScanSection(sectionName: string) {
    setActiveSection(sectionName);
    setScanResults(null);
  }

  function handleDriftScan(request: DriftScanRequest) {
    driftScan.mutate(request, {
      onSuccess: (data) => {
        setScanResults(data);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Drift scan failed"
        );
      },
    });
  }

  if (!author) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Optimizer</h1>
        <AuthorSelector />
      </div>

      <Tabs defaultValue="scan">
        <TabsList>
          <TabsTrigger value="scan">Upload & Scan</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!profile}>
            Brand Mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-6 space-y-6">
          {!profile ? (
            <LinkedInUploader
              authorId={author.id}
              brandId={author.brand_id}
              onProfileParsed={setProfile}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left column: sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Parsed Sections
                  </h2>
                  <button
                    onClick={() => {
                      setProfile(null);
                      setActiveSection(undefined);
                      setScanResults(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Upload new PDF
                  </button>
                </div>
                <SectionViewer
                  profile={profile}
                  onScanSection={handleScanSection}
                  activeScanSection={activeSection}
                />
              </div>

              {/* Right column: scan form + results */}
              <div className="space-y-4">
                {activeSection ? (
                  <>
                    <DriftScanForm
                      sectionName={activeSection}
                      authorId={author.id}
                      sourceContent={profile.raw_text}
                      brandId={author.brand_id}
                      isLoading={driftScan.isPending}
                      onSubmit={handleDriftScan}
                    />
                    {scanResults && (
                      <DriftScanResults
                        suggestions={scanResults.suggestions}
                        positioningGaps={scanResults.positioning_gaps}
                        authorId={author.id}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Select a section from the left to start scanning for
                      authority drift.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mapping" className="mt-6">
          {profile && (
            <BrandMapper
              experiences={profile.experiences}
              authorId={author.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
