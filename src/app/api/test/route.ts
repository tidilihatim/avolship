// src/app/api/test/generate-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Order, { OrderStatus } from '@/lib/db/models/order';
import User, { UserRole } from '@/lib/db/models/user';
import Warehouse from '@/lib/db/models/warehouse';
import Product from '@/lib/db/models/product';
import Expedition from '@/lib/db/models/expedition';
import mongoose from 'mongoose';
import { withDbConnection } from '@/lib/db/db-connect';
import OrderStatusHistory from '@/lib/db/models/order-status-history';

// ============================================
// 🔧 CONFIGURATION VARIABLES - MODIFY THESE
// ============================================

const CONFIG = {
  // Number of orders to generate per request
  ORDERS_TO_GENERATE: 25,
  
  // Date range for random order dates (days ago)
  MIN_DAYS_AGO: 30,  // Orders can be up to 30 days old
  MAX_DAYS_AGO: 0,   // Orders can be as recent as today
  
  // Call attempts configuration
  MIN_CALL_ATTEMPTS: 0,
  MAX_CALL_ATTEMPTS: 5,
  
  // Price range for products (will be multiplied by quantity)
  MIN_PRODUCT_PRICE: 10,
  MAX_PRODUCT_PRICE: 500,
  
  // Product quantity range per order
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 5,
  
  // Maximum number of products per order
  MIN_PRODUCTS_PER_ORDER: 1,
  MAX_PRODUCTS_PER_ORDER: 3,
  
  // Percentage chance for double orders (0-100)
  DOUBLE_ORDER_CHANCE: 15, // 15% chance of creating similar orders
  
  // Status distribution (percentages should add up to 100)
  STATUS_DISTRIBUTION: {
    [OrderStatus.PENDING]: 30,
    [OrderStatus.CONFIRMED]: 25,
    [OrderStatus.CANCELLED]: 15,
    [OrderStatus.WRONG_NUMBER]: 10,
    [OrderStatus.UNREACHED]: 10,
    [OrderStatus.DOUBLE]: 5,
    [OrderStatus.EXPIRED]: 5,
  }
};

// Sample customer data
const SAMPLE_CUSTOMERS = [
  {
    names: ['John Smith', 'Jean Dupont', 'Ahmed Hassan', 'Maria Garcia', 'David Wilson'],
    phoneNumbers: ['+1234567890', '+1987654321', '+1122334455', '+1555666777', '+1999888777'],
    addresses: [
      '123 Main St, New York, NY 10001',
      '456 Oak Ave, Los Angeles, CA 90210',
      '789 Pine Rd, Chicago, IL 60601',
      '321 Elm St, Houston, TX 77001',
      '654 Maple Dr, Miami, FL 33101'
    ]
  }
];

const CALL_STATUSES = ['answered', 'unreached', 'busy', 'invalid'] as const;

// ============================================
// 🛠 UTILITY FUNCTIONS
// ============================================

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(minDaysAgo: number, maxDaysAgo: number): Date {
  const now = new Date();
  const daysAgo = getRandomNumber(maxDaysAgo, minDaysAgo);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function getRandomStatus(): OrderStatus {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [status, percentage] of Object.entries(CONFIG.STATUS_DISTRIBUTION)) {
    cumulative += percentage;
    if (rand <= cumulative) {
      return status as OrderStatus;
    }
  }
  
  return OrderStatus.PENDING; // fallback
}

function generatePhoneNumbers(): string[] {
  const count = getRandomNumber(1, 3); // 1-3 phone numbers
  const phones = [];
  
  for (let i = 0; i < count; i++) {
    const areaCode = getRandomNumber(200, 999);
    const exchange = getRandomNumber(200, 999);
    const number = getRandomNumber(1000, 9999);
    phones.push(`+1${areaCode}${exchange}${number}`);
  }
  
  return phones;
}

function generateCallAttempts(phoneNumbers: string[]): any[] {
  const attemptCount = getRandomNumber(CONFIG.MIN_CALL_ATTEMPTS, CONFIG.MAX_CALL_ATTEMPTS);
  const attempts = [];
  
  for (let i = 0; i < attemptCount; i++) {
    const attemptDate = getRandomDate(7, 0); // Calls within last 7 days
    attempts.push({
      attemptNumber: i + 1,
      phoneNumber: getRandomElement(phoneNumbers),
      attemptDate,
      status: getRandomElement(CALL_STATUSES as any),
      notes: Math.random() > 0.5 ? `Call attempt ${i + 1} notes` : undefined,
    });
  }
  
  return attempts.sort((a, b) => a.attemptDate.getTime() - b.attemptDate.getTime());
}

// ============================================
// 🎯 MAIN API HANDLER
// ============================================

export const GET = withDbConnection(async (request: NextRequest) => {
  try {
    console.log('🚀 Starting test order generation...');
    
    // ============================================
    // 📋 FETCH REQUIRED DATA FROM DATABASE
    // ============================================
    
    console.log('📊 Fetching sellers, warehouses, products, and expeditions...');
    
    const [sellers, warehouses, products, expeditions] = await Promise.all([
      User.find({ role: UserRole.SELLER, status: 'approved' }).lean(),
      Warehouse.find().lean(),
      Product.find().lean(),
      Expedition.find().lean()
    ]);
    
    // ============================================
    // ⚠️ VALIDATION CHECKS
    // ============================================
    
    if (sellers.length === 0) {
      return NextResponse.json({
        success: false,
        message: '❌ No approved sellers found. Please create some sellers first.',
        required: 'Approved sellers with role "seller" and status "approved"'
      });
    }
    
    if (warehouses.length === 0) {
      return NextResponse.json({
        success: false,
        message: '❌ No active warehouses found. Please create some warehouses first.',
        required: 'Active warehouses with isActive: true'
      });
    }
    
    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        message: '❌ No active products found. Please create some products first.',
        required: 'Active products with status "active" and totalStock > 0'
      });
    }
    
    if (expeditions.length === 0) {
      return NextResponse.json({
        success: false,
        message: '❌ No approved expeditions found. Please create some expeditions first.',
        required: 'Approved expeditions with status "approved" (needed for product pricing)'
      });
    }
    
    console.log(`✅ Found: ${sellers.length} sellers, ${warehouses.length} warehouses, ${products.length} products, ${expeditions.length} expeditions`);
    
    // ============================================
    // 🎲 GENERATE RANDOM ORDERS
    // ============================================
    
    const orders = [];
    const statusHistories = [];
    
    // Helper function to generate unique order ID
    function generateOrderId(): string {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `ORD-${timestamp}-${random}`;
    }
    
    for (let i = 0; i < CONFIG.ORDERS_TO_GENERATE; i++) {
      // Select random data
      const seller = getRandomElement(sellers);
      const warehouse = getRandomElement(warehouses);
      const orderDate = getRandomDate(CONFIG.MIN_DAYS_AGO, CONFIG.MAX_DAYS_AGO);
      const status = getRandomStatus();
      
      // Generate customer data
      const customerName = getRandomElement(SAMPLE_CUSTOMERS[0].names);
      const phoneNumbers = generatePhoneNumbers();
      const shippingAddress = getRandomElement(SAMPLE_CUSTOMERS[0].addresses);
      
      // Generate products for this order
      const productsCount = getRandomNumber(CONFIG.MIN_PRODUCTS_PER_ORDER, CONFIG.MAX_PRODUCTS_PER_ORDER);
      const orderProducts = [];
      let totalPrice = 0;
      
      for (let j = 0; j < productsCount; j++) {
        const product = getRandomElement(products);
        const expedition = getRandomElement(expeditions);
        const quantity = getRandomNumber(CONFIG.MIN_QUANTITY, CONFIG.MAX_QUANTITY);
        const unitPrice = getRandomNumber(CONFIG.MIN_PRODUCT_PRICE, CONFIG.MAX_PRODUCT_PRICE);
        
        orderProducts.push({
          productId: product._id,
          quantity,
          unitPrice,
          expeditionId: expedition._id,
        });
        
        totalPrice += quantity * unitPrice;
      }
      
      // Generate call attempts
      const callAttempts = generateCallAttempts(phoneNumbers);
      
      // ✅ MANUALLY GENERATE ORDER ID (Fix for insertMany issue)
      const orderId = generateOrderId();
      
      // Create order object with manually generated orderId
      const order = new Order({
        orderId, // 🔧 Explicitly set the orderId here
        customer: {
          name: customerName,
          phoneNumbers,
          shippingAddress,
        },
        warehouseId: warehouse._id,
        sellerId: seller._id,
        products: orderProducts,
        totalPrice,
        status,
        statusComment: status === OrderStatus.CANCELLED ? 'Test cancellation reason' : undefined,
        statusChangedAt: orderDate,
        callAttempts,
        totalCallAttempts: callAttempts.length,
        lastCallAttempt: callAttempts.length > 0 ? callAttempts[callAttempts.length - 1].attemptDate : undefined,
        isDouble: Math.random() * 100 < CONFIG.DOUBLE_ORDER_CHANCE,
        doubleOrderReferences: [], // Will be populated later if needed
        orderDate,
      });
      
      orders.push(order);
      
      // Create status history
      const statusHistory = {
        orderId: order._id,
        currentStatus: status,
        changeDate: orderDate,
        automaticChange: true,
        changeReason: 'Test data generation',
      };
      
      statusHistories.push(statusHistory);
    }
    
    // ============================================
    // 💾 SAVE TO DATABASE
    // ============================================
    
    console.log(`💾 Saving ${orders.length} orders to database...`);
    
    const savedOrders = await Order.insertMany(orders);
    
    // Update status histories with actual order IDs
    const updatedStatusHistories = statusHistories.map((history, index) => ({
      ...history,
      orderId: savedOrders[index]._id,
    }));
    
    await OrderStatusHistory.insertMany(updatedStatusHistories);
    
    // ============================================
    // 🔄 HANDLE DOUBLE ORDERS
    // ============================================
    
    const doubleOrders = savedOrders.filter(order => order.isDouble);
    if (doubleOrders.length > 0) {
      console.log(`🔄 Processing ${doubleOrders.length} double orders...`);
      
      for (const doubleOrder of doubleOrders) {
        // Find a random existing order to mark as similar
        const potentialSimilar = savedOrders.filter(o => o._id.toString() !== doubleOrder._id.toString());
        if (potentialSimilar.length > 0) {
          const similarOrder = getRandomElement(potentialSimilar);
          
          // Update both orders with double references
          await Order.findByIdAndUpdate(doubleOrder._id, {
            $push: {
              doubleOrderReferences: {
                orderId: similarOrder._id,
                similarity: {
                  sameName: Math.random() > 0.5,
                  samePhone: Math.random() > 0.5,
                  sameProduct: Math.random() > 0.5,
                  orderDateDifference: Math.floor(Math.random() * 24), // Hours
                },
              },
            },
          });
          
          await Order.findByIdAndUpdate(similarOrder._id, {
            isDouble: true,
            $push: {
              doubleOrderReferences: {
                orderId: doubleOrder._id,
                similarity: {
                  sameName: Math.random() > 0.5,
                  samePhone: Math.random() > 0.5,
                  sameProduct: Math.random() > 0.5,
                  orderDateDifference: Math.floor(Math.random() * 24), // Hours
                },
              },
            },
          });
        }
      }
    }
    
    // ============================================
    // ✅ SUCCESS RESPONSE
    // ============================================
    
    console.log('✅ Order generation completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: `🎉 Successfully generated ${savedOrders.length} test orders!`,
      data: {
        ordersCreated: savedOrders.length,
        statusHistoriesCreated: statusHistories.length,
        doubleOrdersCreated: doubleOrders.length,
        config: CONFIG,
        summary: {
          sellers: sellers.length,
          warehouses: warehouses.length,
          products: products.length,
          expeditions: expeditions.length,
        },
      },
    });
    
  } catch (error: any) {
    console.error('❌ Error generating test orders:', error);
    
    return NextResponse.json({
      success: false,
      message: '❌ Failed to generate test orders',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
});

// ============================================
// 📖 API DOCUMENTATION
// ============================================

export const POST = async () => {
  return NextResponse.json({
    message: 'ℹ️ This endpoint only supports GET requests',
    usage: {
      method: 'GET',
      endpoint: '/api/test/generate-orders',
      description: 'Generates random test orders for development and testing',
      configuration: {
        location: 'Top of the file in CONFIG object',
        modifiable: [
          'ORDERS_TO_GENERATE',
          'MIN_DAYS_AGO',
          'MAX_DAYS_AGO',
          'MIN_CALL_ATTEMPTS',
          'MAX_CALL_ATTEMPTS',
          'MIN_PRODUCT_PRICE',
          'MAX_PRODUCT_PRICE',
          'MIN_QUANTITY',
          'MAX_QUANTITY',
          'DOUBLE_ORDER_CHANCE',
          'STATUS_DISTRIBUTION',
        ],
      },
      requirements: [
        'At least one approved seller (role: seller, status: approved)',
        'At least one active warehouse (isActive: true)',
        'At least one active product (status: active, totalStock > 0)',
        'At least one approved expedition (status: approved)',
      ],
    },
  });
};