"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { featuredProviderAdSchema, type FeaturedProviderAdInput } from "@/lib/validations/featured-provider-ad";
import { AdStatus, AdPriority, AdPlacement } from "@/types/featured-provider-ad";
import { africanCountries } from "@/app/dashboard/_constant";

interface CreateFeaturedAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Provider {
  _id: string;
  businessName: string;
  email: string;
}

export default function CreateFeaturedAdDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateFeaturedAdDialogProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);

  const form = useForm<FeaturedProviderAdInput>({
    resolver: zodResolver(featuredProviderAdSchema),
    defaultValues: {
      title: "",
      description: "",
      ctaText: "Contact Provider",
      status: AdStatus.PENDING,
      priority: AdPriority.MEDIUM,
      placement: [AdPlacement.DASHBOARD_BANNER],
      targetCountries: [],
    },
  });

  useEffect(() => {
    if (open) {
      fetchProviders();
    }
  }, [open]);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/admin/users?role=PROVIDER&status=APPROVED");
      if (!response.ok) throw new Error("Failed to fetch providers");
      const data = await response.json();
      setProviders(data.users || []);
    } catch (error) {
      toast.error("Failed to load providers");
    }
  };

  const onSubmit = async (data: FeaturedProviderAdInput) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/featured-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create ad");
      }

      toast.success("Featured ad created successfully");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create featured ad");
    } finally {
      setLoading(false);
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
          <DialogTitle>Create Featured Provider Ad</DialogTitle>
          <DialogDescription>
            Create a new featured advertisement for a provider. This will be displayed to sellers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider._id} value={provider._id}>
                          {provider.businessName} ({provider.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    The main headline for the ad (max 100 characters)
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
                    Brief description of the service (max 300 characters)
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
                      <Input placeholder="Contact Provider" {...field} />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AdStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={AdStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={AdStatus.PAUSED}>Paused</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AdPriority.LOW.toString()}>Low</SelectItem>
                        <SelectItem value={AdPriority.MEDIUM.toString()}>Medium</SelectItem>
                        <SelectItem value={AdPriority.HIGH.toString()}>High</SelectItem>
                        <SelectItem value={AdPriority.PREMIUM.toString()}>Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Higher priority ads appear first
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return date < (startDate || new Date());
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormDescription>Total budget in USD</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxImpressions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Impressions (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxClicks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Clicks (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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