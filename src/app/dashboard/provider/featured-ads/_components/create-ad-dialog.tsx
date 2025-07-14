"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import { CalendarIcon, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { AdPlacement } from "@/types/featured-provider-ad";
import { africanCountries } from "@/app/dashboard/_constant";
import { useSession } from "next-auth/react";
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";

const createAdSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(300, 'Description must be less than 300 characters'),
  bannerImageUrl: z.string().optional(),
  ctaText: z.string().min(1, 'CTA text is required').max(50, 'CTA text must be less than 50 characters'),
  ctaLink: z.string().url('Invalid CTA link').optional().or(z.literal('')),
  placement: z.array(z.enum(['DASHBOARD_BANNER', 'SEARCH_RESULTS', 'SIDEBAR', 'ALL'])).min(1, 'At least one placement is required'),
  startDate: z.date(),
  durationDays: z.number().min(1, 'Duration must be at least 1 day').max(365, 'Maximum duration is 365 days'),
  proposedPrice: z.number().min(0, 'Price must be positive'),
  targetCountries: z.array(z.string()).optional(),
});

type CreateAdInput = z.infer<typeof createAdSchema>;

interface CreateAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateAdDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAdDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { data: session } = useSession();

  const form = useForm<CreateAdInput>({
    resolver: zodResolver(createAdSchema),
    defaultValues: {
      title: "",
      description: "",
      ctaText: "Contact Us",
      placement: [AdPlacement.DASHBOARD_BANNER],
      startDate: new Date(),
      durationDays: 30,
      proposedPrice: 0,
      targetCountries: [],
    },
  });

  const onSubmit = async (data: CreateAdInput) => {
    setLoading(true);
    try {
      const endDate = addDays(data.startDate, data.durationDays);
      
      const response = await fetch("/api/provider/featured-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create ad");
      }

      toast.success("Ad created successfully! It will be reviewed by our admin team.");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create ad");
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploadingBanner(true);
    try {
      const { url } = await uploadToCloudinary(file);
      form.setValue("bannerImageUrl", url);
      toast.success("Banner uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const placementOptions = [
    { value: AdPlacement.DASHBOARD_BANNER, label: "Dashboard Banner" },
    { value: AdPlacement.SEARCH_RESULTS, label: "Search Results" },
    { value: AdPlacement.SIDEBAR, label: "Sidebar" },
    { value: AdPlacement.ALL, label: "All Placements" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Featured Ad</DialogTitle>
          <DialogDescription>
            Create a new advertisement to promote your services. Your ad will be reviewed by our admin team before going live.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Premium Shipping Services" {...field} />
                  </FormControl>
                  <FormDescription>
                    The main headline for your ad (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Fast and reliable shipping across Africa with real-time tracking..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of your service (max 300 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bannerImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                      />
                      {uploadingBanner && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading banner...
                        </div>
                      )}
                      {field.value && (
                        <div className="relative mt-2">
                          <img
                            src={field.value}
                            alt="Banner preview"
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => form.setValue("bannerImageUrl", "")}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a banner image for your ad (recommended: 1200x300px)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="ctaText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call to Action Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact Us" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ctaLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call to Action Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty to use default provider contact
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="placement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Placements</FormLabel>
                  <div className="space-y-2">
                    {placementOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, option.value]);
                            } else {
                              field.onChange(field.value.filter((v) => v !== option.value));
                            }
                          }}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="365" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      How many days should the ad run?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="proposedPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Price ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      placeholder="100.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Your proposed price for the entire duration. The admin will review and may negotiate.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Ad
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}