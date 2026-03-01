"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BrandLogoUpload } from "./brand-logo-upload";
import { useUpdateBrand } from "@/lib/api/hooks/use-brands";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Brand } from "@/lib/api/types";

interface EditBrandDialogProps {
  brand: Brand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBrandDialog({
  brand,
  open,
  onOpenChange,
}: EditBrandDialogProps) {
  const updateBrand = useUpdateBrand();

  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline ?? "");
  const [description, setDescription] = useState(brand.description ?? "");
  const [website, setWebsite] = useState(brand.website_url ?? "");
  const [brandColor, setBrandColor] = useState(brand.brand_color ?? "#6366f1");
  const [error, setError] = useState<string | null>(null);

  // Reset form when brand prop changes
  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline ?? "");
    setDescription(brand.description ?? "");
    setWebsite(brand.website_url ?? "");
    setBrandColor(brand.brand_color ?? "#6366f1");
    setError(null);
  }, [brand]);

  async function handleSubmit() {
    setError(null);
    try {
      await updateBrand.mutateAsync({
        brandId: brand.id,
        updates: {
          name: name.trim(),
          tagline: tagline || null,
          description: description || null,
          website_url: website || null,
          brand_color: brandColor || null,
        },
      });
      toast.success("Brand updated");
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update brand";
      setError(msg);
    }
  }

  const canSubmit = name.trim().length > 0 && !updateBrand.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Brand</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <BrandLogoUpload
              brandId={brand.id}
              userId={brand.user_id}
              currentLogoUrl={brand.logo_url}
              brandName={brand.name}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{brand.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {brand.brand_type} brand
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-brand-name">Name *</Label>
            <Input
              id="edit-brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="edit-brand-tagline">Tagline</Label>
            <Input
              id="edit-brand-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Short tagline"
            />
          </div>

          <div>
            <Label htmlFor="edit-brand-desc">Description</Label>
            <Textarea
              id="edit-brand-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="edit-brand-website">Website</Label>
            <Input
              id="edit-brand-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="edit-brand-color">Brand Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="edit-brand-color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border p-0.5"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
                maxLength={7}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {updateBrand.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
