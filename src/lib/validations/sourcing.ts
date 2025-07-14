import { z } from 'zod';

export const createSourcingRequestSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  sourceLink: z.union([
    z.string().url('Please provide a valid URL'),
    z.literal(''),
    z.undefined()
  ]).optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  targetPrice: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('USD'),
  destinationWarehouse: z.string().min(1, 'Warehouse is required'),
  requiredByDate: z.string().transform(str => new Date(str)),
  sourcingCountry: z.string().min(1, 'Sourcing country is required'),
  preferredSupplierRegion: z.string().optional(),
  urgencyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().optional(),
});

export const updateSourcingRequestSchema = z.object({
  productName: z.string().min(3).optional(),
  productDescription: z.string().min(10).optional(),
  productImages: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  specifications: z.record(z.any()).optional(),
  quantity: z.number().min(1).optional(),
  targetPrice: z.number().min(0).optional(),
  requiredByDate: z.string().transform(str => new Date(str)).optional(),
  sourcingCountry: z.string().optional(),
  preferredSupplierRegion: z.string().optional(),
  urgencyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const providerResponseSchema = z.object({
  adjustedPrice: z.number().min(0).optional(),
  adjustedQuantity: z.number().min(1).optional(),
  deliveryDate: z.string().transform(str => new Date(str)).optional(),
  notes: z.string().optional(),
});

export const negotiationMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  priceOffer: z.number().min(0).optional(),
  quantityOffer: z.number().min(1).optional(),
});

export const approveSourcingSchema = z.object({
  finalPrice: z.number().min(0, 'Final price is required'),
  finalQuantity: z.number().min(1, 'Final quantity is required'),
});

export const paymentDetailsSchema = z.object({
  amount: z.number().min(0),
  method: z.string().min(1),
  transactionId: z.string().min(1),
});

export const shippingDetailsSchema = z.object({
  trackingNumber: z.string().min(1),
  carrier: z.string().min(1),
  estimatedDelivery: z.string().transform(str => new Date(str)),
  expeditionStatus: z.enum(['PENDING', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'DELAYED']).optional(),
  expeditionId: z.string().optional(),
});