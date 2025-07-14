// Type definitions for Featured Provider Ads
// These can be safely imported in client components

export enum AdStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED'
}

export enum AdPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  PREMIUM = 4
}

export enum AdPlacement {
  DASHBOARD_BANNER = 'DASHBOARD_BANNER',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  SIDEBAR = 'SIDEBAR',
  ALL = 'ALL'
}

export interface FeaturedProviderAd {
  _id: string;
  provider: {
    _id: string;
    businessName: string;
    businessInfo?: string;
    serviceType?: string;
    profileImage?: string;
    email: string;
    country?: string;
  };
  title: string;
  description: string;
  bannerImageUrl?: string;
  imageUrl?: string;
  ctaText: string;
  ctaLink?: string;
  status: AdStatus;
  priority: AdPriority;
  placement: AdPlacement[];
  startDate: Date | string;
  endDate: Date | string;
  durationDays: number;
  proposedPrice: number;
  approvedPrice?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod?: string;
  paymentNotes?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: Date | string;
  budget?: number;
  spentAmount: number;
  impressions: number;
  clicks: number;
  maxImpressions?: number;
  maxClicks?: number;
  targetCountries?: string[];
  targetCategories?: string[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}