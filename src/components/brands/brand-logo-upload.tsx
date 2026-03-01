"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUpdateBrand } from "@/lib/api/hooks/use-brands";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const BUCKET = "brand-assets";

interface BrandLogoUploadProps {
  brandId: string;
  userId: string;
  currentLogoUrl: string | null;
  brandName: string;
}

export function BrandLogoUpload({
  brandId,
  userId,
  currentLogoUrl,
  brandName,
}: BrandLogoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateBrand = useUpdateBrand();

  const initials = brandName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG, WebP, and GIF images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("File must be under 2MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/${brandId}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      await updateBrand.mutateAsync({
        brandId,
        updates: { logo_url: urlData.publicUrl },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        <Avatar className="h-12 w-12">
          {currentLogoUrl && <AvatarImage src={currentLogoUrl} alt={brandName} />}
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          className="absolute inset-0 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Camera className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
