"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, Square, RotateCcw, Play, Pause } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isTranscribing?: boolean;
  submitLabel?: string;
}

export function AudioRecorder({
  onRecordingComplete,
  isTranscribing,
  submitLabel = "Transcribe & Mine Voice",
}: AudioRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "recorded">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [audioUrl]);

  useEffect(() => () => cleanup(), [cleanup]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      setState("idle");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }

  function resetRecording() {
    cleanup();
    setState("idle");
    setElapsed(0);
    setAudioUrl(null);
    setIsPlaying(false);
    blobRef.current = null;
  }

  function togglePlayback() {
    if (!audioUrl) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  }

  function handleSubmit() {
    if (blobRef.current) onRecordingComplete(blobRef.current);
  }

  const MAX_DURATION = 30 * 60;

  useEffect(() => {
    if (state === "recording" && elapsed >= MAX_DURATION) {
      stopRecording();
    }
  }, [state, elapsed]);

  if (isTranscribing) {
    return (
      <div className="rounded-lg border p-8 text-center space-y-3">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
        <p className="text-sm font-medium">Transcribing your recording...</p>
        <p className="text-xs text-muted-foreground">
          This may take 10-30 seconds depending on length.
        </p>
      </div>
    );
  }

  if (state === "idle") {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Mic className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Record a voice brain dump</p>
          <p className="text-xs text-muted-foreground">
            Speak naturally about your idea. The system will transcribe your
            recording.
          </p>
        </div>
        <Button onClick={startRecording} variant="outline" className="gap-2">
          <Mic className="h-4 w-4" />
          Start Recording
        </Button>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto animate-pulse">
          <Mic className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold tabular-nums">
            {formatTime(elapsed)}
          </p>
          <p className="text-xs text-muted-foreground">
            Recording... (max {formatTime(MAX_DURATION)})
          </p>
        </div>
        <Button
          onClick={stopRecording}
          variant="destructive"
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          Stop Recording
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Recording complete</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(elapsed)} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayback}
            className="gap-1.5"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isPlaying ? "Pause" : "Preview"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetRecording}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Re-record
          </Button>
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full gap-2">
        <Mic className="h-4 w-4" />
        {submitLabel}
      </Button>
    </div>
  );
}
