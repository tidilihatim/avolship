import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/user';
import Product from '@/lib/db/models/product';
import Warehouse from '@/lib/db/models/warehouse';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import ProviderRating from '@/lib/db/models/provider-rating';
import mongoose from 'mongoose';

// Sample product data for testing
const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    category: 'Electronics',
    description: 'High-quality wireless headphones with noise cancellation',
    sourceLink: 'https://example.com/product/headphones',
    images: ['https://via.placeholder.com/400x300/0000FF/FFFFFF?text=Headphones']
  },
  {
    name: 'Smart Watch Pro',
    category: 'Electronics',
    description: 'Advanced fitness tracking smartwatch',
    sourceLink: 'https://example.com/product/smartwatch',
    images: ['https://via.placeholder.com/400x300/00FF00/FFFFFF?text=SmartWatch']
  },
  {
    name: 'Premium Coffee Maker',
    category: 'Home Appliances',
    description: 'Professional grade coffee maker with timer',
    sourceLink: 'https://example.com/product/coffee-maker',
    images: ['https://via.placeholder.com/400x300/FF0000/FFFFFF?text=CoffeeMaker']
  },
  {
    name: 'LED Desk Lamp',
    category: 'Office Supplies',
    description: 'Adjustable LED lamp with multiple brightness levels',
    sourceLink: 'https://example.com/product/desk-lamp',
    images: ['https://via.placeholder.com/400x300/FFFF00/000000?text=DeskLamp']
  },
  {
    name: 'Portable Power Bank',
    category: 'Electronics',
    description: '20000mAh fast charging power bank',
    sourceLink: 'https://example.com/product/power-bank',
    images: ['https://via.placeholder.com/400x300/FF00FF/FFFFFF?text=PowerBank']
  }
];

const sourcingCountries = ['China', 'Turkey', 'Morocco', 'UAE', 'India'];
const statuses = ['PENDING', 'NEGOTIATING', 'APPROVED', 'PAID', 'SHIPPING', 'DELIVERED'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Allow both admin and seller to generate test data in development
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In development, allow sellers to generate their own test data
    if (process.env.NODE_ENV === 'development') {
      if (!['ADMIN', 'admin', 'SELLER', 'seller'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized - Admin or Seller access required' }, { status: 401 });
      }
    } else {
      // In production, only admins
      if (!['ADMIN', 'admin'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
      }
    }

    await connectToDatabase();
    
    // Get sellers and providers
    let sellers;
    if (['SELLER', 'seller'].includes(session.user.role)) {
      // If seller is generating data, use only their account
      const currentSeller = await User.findById(session.user.id);
      sellers = currentSeller ? [currentSeller] : [];
    } else {
      // If admin, get multiple sellers
      sellers = await User.find({ role: { $in: ['SELLER', 'seller'] }, status: 'approved' }).limit(10);
    }
    
    const providers = await User.find({ role: { $in: ['PROVIDER', 'provider'] }, status: 'approved' }).limit(10);
    const warehouses = await Warehouse.find().limit(5);
    
    if (sellers.length === 0 || providers.length === 0 || warehouses.length === 0) {
      return NextResponse.json({ 
        error: 'Need at least one seller, provider, and warehouse to create test data' 
      }, { status: 400 });
    }

    let sourcingRequestsCreated = 0;
    let ratingsCreated = 0;
    let productsCreated = 0;
    
    // Create sourcing requests
    for (let i = 0; i < 20; i++) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
      const productData = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Create or find product
      let product = await Product.findOne({ 
        sellerId: seller._id,
        name: productData.name 
      });
      
      if (!product) {
        product = await Product.create({
          sellerId: seller._id,
          warehouseId: warehouse._id,
          name: productData.name,
          description: productData.description,
          category: productData.category,
          regularPrice: Math.floor(Math.random() * 500) + 50,
          costPrice: Math.floor(Math.random() * 300) + 30,
          stock: Math.floor(Math.random() * 100) + 10,
          images: productData.images,
          status: 'active'
        });
        productsCreated++;
      }
      
      // Create sourcing request
      const requestData: any = {
        sellerId: seller._id,
        status,
        productId: product._id,
        sourceLink: productData.sourceLink,
        productName: product.name,
        productDescription: product.description,
        productImages: product.images,
        category: product.category,
        specifications: {
          brand: 'TestBrand',
          model: `Model-${i}`,
          warranty: '1 year'
        },
        quantity: Math.floor(Math.random() * 1000) + 100,
        targetPrice: Math.floor(Math.random() * 100) + 20,
        currency: 'USD',
        destinationWarehouse: warehouse._id,
        requiredByDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        sourcingCountry: sourcingCountries[Math.floor(Math.random() * sourcingCountries.length)],
        urgencyLevel: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
        notes: `Test sourcing request ${i + 1}`,
        tags: ['test', 'sample']
      };
      
      // Add provider and negotiation data for non-pending requests
      if (status !== 'PENDING') {
        requestData.providerId = provider._id;
        requestData.providerResponse = {
          adjustedPrice: requestData.targetPrice + Math.floor(Math.random() * 20) - 10,
          adjustedQuantity: requestData.quantity,
          deliveryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          notes: 'Can deliver within 20 days',
          respondedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        };
        
        requestData.negotiations = [
          {
            senderId: seller._id,
            senderRole: 'SELLER',
            message: 'Can you provide a better price for bulk order?',
            priceOffer: requestData.targetPrice,
            quantityOffer: requestData.quantity,
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            senderId: provider._id,
            senderRole: 'PROVIDER',
            message: 'Best price for this quantity',
            priceOffer: requestData.providerResponse.adjustedPrice,
            quantityOffer: requestData.quantity,
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          }
        ];
      }
      
      // Add approval and payment data for approved+ statuses
      if (['APPROVED', 'PAID', 'SHIPPING', 'DELIVERED'].includes(status)) {
        requestData.approvedAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
        requestData.approvedBy = seller._id;
        requestData.finalPrice = requestData.providerResponse.adjustedPrice;
        requestData.finalQuantity = requestData.quantity;
      }
      
      // Add payment data for paid+ statuses
      if (['PAID', 'SHIPPING', 'DELIVERED'].includes(status)) {
        requestData.paymentStatus = 'PAID';
        requestData.paymentDetails = {
          amount: requestData.finalPrice * requestData.finalQuantity,
          method: 'Bank Transfer',
          transactionId: `TXN-${Date.now()}-${i}`,
          paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          currency: 'USD'
        };
      }
      
      // Add shipping data for shipping+ statuses
      if (['SHIPPING', 'DELIVERED'].includes(status)) {
        requestData.shippingDetails = {
          trackingNumber: `TRACK-${Date.now()}-${i}`,
          carrier: 'DHL Express',
          shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          expeditionStatus: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT'
        };
      }
      
      // Add delivery data for delivered status
      if (status === 'DELIVERED') {
        requestData.shippingDetails.deliveredAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      }
      
      const sourcingRequest = await SourcingRequest.create(requestData);
      sourcingRequestsCreated++;
      
      // Create rating for delivered requests (50% chance)
      if (status === 'DELIVERED' && Math.random() > 0.5) {
        const rating = await ProviderRating.create({
          providerId: provider._id,
          sellerId: seller._id,
          sourcingRequestId: sourcingRequest._id,
          qualityScore: Math.floor(Math.random() * 2) + 3, // 3-5
          communicationScore: Math.floor(Math.random() * 2) + 3,
          reliabilityScore: Math.floor(Math.random() * 2) + 3,
          pricingScore: Math.floor(Math.random() * 2) + 3,
          review: `Great experience working with this provider. ${['Fast delivery', 'Good communication', 'Quality products', 'Fair pricing'][Math.floor(Math.random() * 4)]}.`,
          wouldRecommend: Math.random() > 0.2,
          deliveredOnTime: Math.random() > 0.1,
          productQualityMet: Math.random() > 0.1,
          pricingAsAgreed: Math.random() > 0.05,
          packagingQuality: ['GOOD', 'EXCELLENT'][Math.floor(Math.random() * 2)],
          tags: ['reliable', 'professional', 'recommended']
        });
        ratingsCreated++;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        productsCreated,
        sourcingRequestsCreated,
        ratingsCreated,
        message: `Created ${productsCreated} products, ${sourcingRequestsCreated} sourcing requests, and ${ratingsCreated} ratings`
      }
    });
  } catch (error) {
    console.error('Error creating test sourcing data:', error);
    return NextResponse.json({ 
      error: 'Failed to create test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}