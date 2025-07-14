import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Product from '@/lib/db/models/product';
import SourcingRequest from '@/lib/db/models/sourcing-request';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SELLER', 'ADMIN', 'seller', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Create test products first
    const productNames = [
      'Wireless Bluetooth Headphones',
      'Smart Watch Series 5',
      'USB-C Hub Adapter',
      'Portable Power Bank 20000mAh',
      'Laptop Stand Adjustable'
    ];

    const products = [];
    for (let i = 0; i < productNames.length; i++) {
      const name = productNames[i];
      const product = await Product.create({
        sellerId: session.user.id,
        name,
        code: `PRD-${Date.now()}-${i}`,
        description: `High quality ${name} for testing sourcing requests`,
        warehouses: [], // Empty for now
        totalStock: 0,
        status: 'active'
      });
      products.push(product);
    }

    // Create test sourcing requests
    const testRequests = [];
    const statuses = ['PENDING', 'QUOTED', 'APPROVED', 'ORDERED', 'SHIPPED', 'DELIVERED'];
    const suppliers = ['AliExpress', 'Alibaba', '1688', 'Local Supplier', 'Direct Factory'];

    for (let i = 0; i < 10; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const request: any = {
        sellerId: session.user.id,
        requestNumber: `SR-${Date.now()}-${i}`,
        status,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        items: [{
          productId: product._id,
          productName: product.name,
          productSku: product.code,
          quantity: Math.floor(Math.random() * 50) + 10,
          targetPrice: Math.floor(Math.random() * 100) + 20,
          notes: 'Test sourcing request item'
        }],
        preferredSuppliers: [suppliers[Math.floor(Math.random() * suppliers.length)]],
        targetDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        shippingAddress: {
          street: '123 Test Street',
          city: 'Test City',
          country: 'Test Country',
          postalCode: '12345'
        },
        notes: `Test sourcing request ${i + 1}`
      };

      // Add quote if status requires it
      if (['QUOTED', 'APPROVED', 'ORDERED', 'SHIPPED', 'DELIVERED'].includes(status)) {
        request.quotes = [{
          providerId: session.user.id,
          supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
          items: [{
            productId: product._id,
            quantity: request.items[0].quantity,
            unitPrice: request.items[0].targetPrice * (0.8 + Math.random() * 0.4),
            totalPrice: request.items[0].quantity * request.items[0].targetPrice
          }],
          shippingCost: Math.floor(Math.random() * 50) + 10,
          totalAmount: request.items[0].quantity * request.items[0].targetPrice + 20,
          currency: 'USD',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          estimatedDelivery: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          status: status === 'QUOTED' ? 'pending' : 'accepted'
        }];
      }

      testRequests.push(request);
    }

    await SourcingRequest.insertMany(testRequests);

    return NextResponse.json({ 
      success: true, 
      data: { 
        message: `Created ${products.length} test products and ${testRequests.length} test sourcing requests`,
        productsCreated: products.length,
        requestsCreated: testRequests.length
      } 
    });
  } catch (error) {
    console.error('Seed data error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });
    
    return NextResponse.json({ 
      error: 'Failed to generate test data',
      details: errorMessage
    }, { status: 500 });
  }
}