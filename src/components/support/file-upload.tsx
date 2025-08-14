"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FileIcon, X, Upload } from "lucide-react";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

export function FileUpload({ 
  files, 
  onFilesChange, 
  maxFiles = 3, 
  maxFileSize = 10485760 // 10MB
}: FileUploadProps) {
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;

    const remainingSlots = maxFiles - files.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = filesToAdd.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      alert(`Each file must be less than ${formatFileSize(maxFileSize)}`);
      return;
    }

    // Validate file types (exclude executables and dangerous files)
    const dangerousTypes = [
      'application/x-executable',
      'application/x-msdos-program',
      'application/x-msdownload',
      'application/x-winexe',
      'application/x-winhlp',
      'application/x-winhelp',
      'application/octet-stream'
    ];
    
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'];
    
    const dangerousFiles = filesToAdd.filter(file => {
      const hasRestrictedType = dangerousTypes.includes(file.type);
      const hasRestrictedExtension = dangerousExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      return hasRestrictedType || hasRestrictedExtension;
    });

    if (dangerousFiles.length > 0) {
      alert("Executable files and scripts are not allowed for security reasons");
      return;
    }

    onFilesChange([...files, ...filesToAdd]);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Attachments</Label>
        <span className="text-sm text-muted-foreground">
          {files.length}/{maxFiles}
        </span>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {files.length < maxFiles && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center">
            <FileIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <div className="mt-4">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Files
                  </span>
                </Button>
              </Label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Documents, PDFs, etc. up to {formatFileSize(maxFileSize)} each
            </p>
          </div>
        </div>
      )}
    </div>
  );
}