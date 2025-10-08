"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "./image-upload";
import { FileUpload } from "./file-upload";
import { Plus, Loader2, X } from "lucide-react";
import { TicketAPI } from "@/lib/api/ticket-api";
import { toast } from "sonner";

interface CreateTicketDialogProps {
  trigger?: React.ReactNode;
  onTicketCreated?: (ticket: any) => void;
}

export function CreateTicketDialog({ trigger, onTicketCreated }: CreateTicketDialogProps) {
  const t = useTranslations("callCenterSupport");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (formData: FormData) => {
    const newErrors: Record<string, string> = {};
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;

    if (!title || title.length < 5) {
      newErrors.title = t("dialog.errors.titleMin");
    }
    if (!description || description.length < 10) {
      newErrors.description = t("dialog.errors.descriptionMin");
    }
    if (!category) {
      newErrors.category = t("dialog.errors.categoryRequired");
    }
    if (!priority) {
      newErrors.priority = t("dialog.errors.priorityRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      
      // Simple validation
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      const priority = formData.get("priority") as string;

      const newErrors: Record<string, string> = {};

      if (!title || title.length < 5) {
        newErrors.title = t("dialog.errors.titleMin");
      }
      if (!description || description.length < 10) {
        newErrors.description = t("dialog.errors.descriptionMin");
      }
      if (!category) {
        newErrors.category = t("dialog.errors.categoryRequired");
      }
      if (!priority) {
        newErrors.priority = t("dialog.errors.priorityRequired");
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      // Prepare data for API
      const allFiles = [...images, ...attachments];
      
      const result = await TicketAPI.createTicket({
        title,
        description,
        category,
        priority,
        relatedOrderId: formData.get("relatedOrderId") as string || undefined,
        tags: tags.length > 0 ? tags : undefined,
        files: allFiles.length > 0 ? allFiles : undefined,
      });
      
      if (result.success) {
        toast.success(t("dialog.success"));
        setOpen(false);
        // Reset form
        const form = document.getElementById("create-ticket-form") as HTMLFormElement;
        form?.reset();
        setImages([]);
        setAttachments([]);
        setTags([]);
        onTicketCreated?.(result);
        window.location.reload(); // Refresh to show new ticket
      }
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast.error(error.message || t("dialog.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("createTicket")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("dialog.description")}
          </DialogDescription>
        </DialogHeader>
        
        <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("dialog.titleLabel")}</Label>
            <Input
              id="title"
              name="title"
              placeholder={t("dialog.titlePlaceholder")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t("dialog.categoryLabel")}</Label>
              <Select name="category">
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder={t("dialog.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">{t("category.technical")}</SelectItem>
                  <SelectItem value="billing">{t("category.billing")}</SelectItem>
                  <SelectItem value="account">{t("category.account")}</SelectItem>
                  <SelectItem value="order">{t("category.order")}</SelectItem>
                  <SelectItem value="general">{t("category.general")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">{t("dialog.priorityLabel")}</Label>
              <Select name="priority">
                <SelectTrigger className={errors.priority ? "border-destructive" : ""}>
                  <SelectValue placeholder={t("dialog.priorityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priority.low")}</SelectItem>
                  <SelectItem value="medium">{t("priority.medium")}</SelectItem>
                  <SelectItem value="high">{t("priority.high")}</SelectItem>
                  <SelectItem value="critical">{t("priority.critical")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relatedOrderId">{t("dialog.relatedOrderLabel")}</Label>
            <Input
              id="relatedOrderId"
              name="relatedOrderId"
              placeholder={t("dialog.relatedOrderPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("dialog.descriptionLabel")}</Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t("dialog.descriptionPlaceholder")}
              className={`min-h-[100px] ${errors.description ? "border-destructive" : ""}`}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("dialog.tagsLabel")}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("dialog.tagsPlaceholder")}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                {t("dialog.addButton")}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
            
            <FileUpload
              files={attachments}
              onFilesChange={setAttachments}
              maxFiles={3}
              maxFileSize={10485760}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("dialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}