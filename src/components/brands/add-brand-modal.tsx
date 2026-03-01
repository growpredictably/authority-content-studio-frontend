"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBrand, useBrands } from "@/lib/api/hooks/use-brands";
import { Loader2, Plus } from "lucide-react";
import type { BrandWithChildren } from "@/lib/api/types";

export function AddBrandModal() {
  const [open, setOpen] = useState(false);
  const createBrand = useCreateBrand();
  const { data: brandsData } = useBrands();

  const [brandType, setBrandType] = useState<"company" | "individual">("company");
  const [parentBrandId, setParentBrandId] = useState<string>("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);

  const companyBrands = (brandsData?.hierarchy ?? []) as BrandWithChildren[];

  function reset() {
    setBrandType("company");
    setParentBrandId("");
    setName("");
    setTagline("");
    setDescription("");
    setWebsite("");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    try {
      await createBrand.mutateAsync({
        name: name.trim(),
        brand_type: brandType,
        parent_brand_id: brandType === "individual" ? parentBrandId || null : null,
        tagline: tagline || null,
        description: description || null,
        website_url: website || null,
      });
      reset();
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create brand";
      setError(msg);
    }
  }

  const canSubmit =
    name.trim().length > 0 &&
    (brandType === "company" || parentBrandId) &&
    !createBrand.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add Brand
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Brand Type</Label>
            <Select
              value={brandType}
              onValueChange={(v) => setBrandType(v as "company" | "individual")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Company Brand</SelectItem>
                <SelectItem value="individual">Individual Voice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {brandType === "individual" && (
            <div>
              <Label>Parent Company</Label>
              <Select value={parentBrandId} onValueChange={setParentBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent>
                  {companyBrands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="brand-name">Name *</Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                brandType === "company"
                  ? "e.g., Grow Predictably"
                  : "e.g., Brian Shelton"
              }
            />
          </div>

          <div>
            <Label htmlFor="brand-tagline">Tagline</Label>
            <Input
              id="brand-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Short tagline"
            />
          </div>

          <div>
            <Label htmlFor="brand-desc">Description</Label>
            <Textarea
              id="brand-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="brand-website">Website</Label>
            <Input
              id="brand-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {createBrand.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Brand"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
