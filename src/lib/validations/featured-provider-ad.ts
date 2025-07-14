import { z } from 'zod';

// Define the enums as constants for Zod
const AdStatusEnum = z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'EXPIRED']);
const AdPriorityEnum = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const AdPlacementEnum = z.enum(['DASHBOARD_BANNER', 'SEARCH_RESULTS', 'SIDEBAR', 'ALL']);

// Base schema without refinements
const baseSchema = {
  provider: z.string().min(1, 'Provider is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(300, 'Description must be less than 300 characters'),
  bannerImageUrl: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  ctaText: z.string().min(1, 'CTA text is required').max(50, 'CTA text must be less than 50 characters'),
  ctaLink: z.string().url('Invalid CTA link').optional().or(z.literal('')),
  status: AdStatusEnum,
  priority: AdPriorityEnum,
  placement: z.array(AdPlacementEnum).min(1, 'At least one placement is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  durationDays: z.coerce.number().min(1).max(365),
  proposedPrice: z.coerce.number().min(0),
  approvedPrice: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  paymentNotes: z.string().optional(),
  approvalNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  maxImpressions: z.coerce.number().min(0).optional(),
  maxClicks: z.coerce.number().min(0).optional(),
  targetCountries: z.array(z.string()).optional(),
  targetCategories: z.array(z.string()).optional(),
};

export const featuredProviderAdSchema = z.object(baseSchema).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

// Create update schema manually to avoid .partial() issues
export const updateFeaturedProviderAdSchema = z.object({
  id: z.string().min(1, 'Ad ID is required'),
  provider: baseSchema.provider.optional(),
  title: baseSchema.title.optional(),
  description: baseSchema.description.optional(),
  imageUrl: baseSchema.imageUrl,
  ctaText: baseSchema.ctaText.optional(),
  ctaLink: baseSchema.ctaLink,
  status: baseSchema.status.optional(),
  priority: baseSchema.priority.optional(),
  placement: baseSchema.placement.optional(),
  startDate: baseSchema.startDate.optional(),
  endDate: baseSchema.endDate.optional(),
  budget: baseSchema.budget,
  maxImpressions: baseSchema.maxImpressions,
  maxClicks: baseSchema.maxClicks,
  targetCountries: baseSchema.targetCountries,
  targetCategories: baseSchema.targetCategories,
});

export type FeaturedProviderAdInput = z.infer<typeof featuredProviderAdSchema>;
export type UpdateFeaturedProviderAdInput = z.infer<typeof updateFeaturedProviderAdSchema>;