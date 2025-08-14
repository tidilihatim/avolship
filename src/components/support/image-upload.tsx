"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ImageIcon, X, Upload } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const invalidFiles = filesToAdd.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert("Only JPG, PNG, GIF, and WebP images are allowed");
      return;
    }

    // Validate file sizes (5MB each)
    const oversizedFiles = filesToAdd.filter(file => file.size > 5242880);
    if (oversizedFiles.length > 0) {
      alert("Each image must be less than 5MB");
      return;
    }

    onImagesChange([...images, ...filesToAdd]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const createPreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Images</Label>
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((file, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={createPreviewUrl(file)}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">
                  {file.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <div className="mt-4">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Images
                  </span>
                </Button>
              </Label>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              PNG, JPG, GIF up to 5MB each
            </p>
          </div>
        </div>
      )}
    </div>
  );
}