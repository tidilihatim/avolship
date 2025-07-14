"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { FeaturedProviderAd, AdStatus } from "@/types/featured-provider-ad";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const approvalSchema = z.object({
  approvedPrice: z.number().min(0, 'Price must be positive'),
  approvalNotes: z.string().optional(),
});

type ApprovalInput = z.infer<typeof approvalSchema>;

interface ApprovalDialogProps {
  ad: FeaturedProviderAd;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ApprovalDialog({
  ad,
  open,
  onOpenChange,
  onSuccess,
}: ApprovalDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ApprovalInput>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      approvedPrice: ad.proposedPrice,
      approvalNotes: "",
    },
  });

  const onSubmit = async (data: ApprovalInput) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/featured-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ad._id,
          status: AdStatus.APPROVED,
          approvedPrice: data.approvedPrice,
          approvalNotes: data.approvalNotes,
          approvedAt: new Date(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve ad");
      }

      toast.success("Ad approved successfully!");
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to approve ad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approve Featured Ad</DialogTitle>
          <DialogDescription>
            Review and approve this featured ad request from {ad.provider.businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Ad Details</h4>
            <div className="rounded-lg border p-4 space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Title:</span>
                <p className="font-medium">{ad.title}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="text-sm">{ad.description}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Duration:</span>
                <p className="text-sm">
                  {ad.durationDays} days ({format(new Date(ad.startDate), "MMM d, yyyy")} - {format(new Date(ad.endDate), "MMM d, yyyy")})
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Placements:</span>
                <div className="flex gap-1 mt-1">
                  {ad.placement.map(p => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="approvedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approved Price ($)</FormLabel>
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
                      Provider proposed: ${ad.proposedPrice}. You can negotiate the final price.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approvalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any notes about the approval, payment instructions, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes will be visible to the provider
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
                  Approve Ad
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}