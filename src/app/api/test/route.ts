import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as connectDB } from '@/lib/db/mongoose';
import StockHistory, { StockMovementType, StockMovementReason } from '@/lib/db/models/stock-history';
import Product from '@/lib/db/models/product';
import User from '@/lib/db/models/user';
import mongoose from 'mongoose';
import { getCurrentUser } from '@/app/actions/auth';

const PRODUCT_ID = '68308f3f55b1cf3779cca24a';

/**
 * Generate dummy stock history data for testing
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get current user from session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    // Verify product exists
    const product = await Product.findById(PRODUCT_ID);
    if (!product) {
      return NextResponse.json(
        { success: false, message: `Product with ID ${PRODUCT_ID} not found` },
        { status: 404 }
      );
    }

    // Get product warehouses
    if (!product.warehouses || product.warehouses.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product has no warehouses configured' },
        { status: 400 }
      );
    }

    const warehouses = product.warehouses;
    const userId = new mongoose.Types.ObjectId(user._id);
    const productId = new mongoose.Types.ObjectId(PRODUCT_ID);

    // Generate dummy stock movements
    const stockMovements = [];
    const now = new Date();

    // Helper function to generate random date within last 30 days
    const getRandomDate = (daysAgo: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      return date;
    };

    // Generate movements for each warehouse
    for (const warehouse of warehouses) {
      const warehouseId = warehouse.warehouseId;
      let currentStock = warehouse.stock || 0;
      
      // Generate 10-15 random movements per warehouse
      const movementCount = Math.floor(Math.random() * 6) + 10; // 10-15 movements

      for (let i = 0; i < movementCount; i++) {
        const movementDate = getRandomDate(30); // Within last 30 days
        
        // Randomly choose movement type and reason
        const movementTypes = Object.values(StockMovementType);
        const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
        
        let reasons: StockMovementReason[];
        if (movementType === StockMovementType.INCREASE) {
          reasons = [
            StockMovementReason.INITIAL_STOCK,
            StockMovementReason.RESTOCK,
            StockMovementReason.RETURN_FROM_CUSTOMER,
            StockMovementReason.WAREHOUSE_TRANSFER_IN,
            StockMovementReason.MANUAL_ADJUSTMENT_INCREASE,
            StockMovementReason.INVENTORY_CORRECTION_INCREASE,
          ];
        } else {
          reasons = [
            StockMovementReason.ORDER_CONFIRMED,
            StockMovementReason.DAMAGED_GOODS,
            StockMovementReason.LOST_GOODS,
            StockMovementReason.WAREHOUSE_TRANSFER_OUT,
            StockMovementReason.MANUAL_ADJUSTMENT_DECREASE,
            StockMovementReason.INVENTORY_CORRECTION_DECREASE,
            StockMovementReason.EXPIRED_GOODS,
          ];
        }
        
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        
        // Generate quantity (1-50 for most movements, 50-200 for restocks)
        let quantity;
        if (reason === StockMovementReason.RESTOCK) {
          quantity = Math.floor(Math.random() * 150) + 50; // 50-200 for restocks
        } else {
          quantity = Math.floor(Math.random() * 50) + 1; // 1-50 for others
        }
        
        const previousStock = currentStock;
        let newStock;
        
        if (movementType === StockMovementType.INCREASE) {
          newStock = previousStock + quantity;
        } else {
          // Ensure we don't go below 0
          if (previousStock < quantity) {
            quantity = Math.max(1, Math.floor(previousStock / 2)); // Take half or at least 1
          }
          newStock = Math.max(0, previousStock - quantity);
        }
        
        currentStock = newStock;
        
        // Generate notes based on reason
        const noteTemplates = {
          [StockMovementReason.INITIAL_STOCK]: ['Initial inventory setup', 'Starting stock count'],
          [StockMovementReason.RESTOCK]: ['Supplier delivery received', 'Weekly restock', 'Emergency restock'],
          [StockMovementReason.RETURN_FROM_CUSTOMER]: ['Customer return - unused', 'Defective item returned'],
          [StockMovementReason.WAREHOUSE_TRANSFER_IN]: ['Transfer from main warehouse', 'Stock redistribution'],
          [StockMovementReason.MANUAL_ADJUSTMENT_INCREASE]: ['Manual correction - count error', 'Found missing inventory'],
          [StockMovementReason.INVENTORY_CORRECTION_INCREASE]: ['Audit adjustment', 'System correction'],
          [StockMovementReason.ORDER_CONFIRMED]: ['Order #ORD-' + Math.floor(Math.random() * 10000), 'Customer purchase'],
          [StockMovementReason.DAMAGED_GOODS]: ['Damaged during handling', 'Quality control rejection'],
          [StockMovementReason.LOST_GOODS]: ['Inventory shortage', 'Missing items'],
          [StockMovementReason.WAREHOUSE_TRANSFER_OUT]: ['Transfer to branch warehouse', 'Stock redistribution'],
          [StockMovementReason.MANUAL_ADJUSTMENT_DECREASE]: ['Manual correction - overcount', 'Inventory adjustment'],
          [StockMovementReason.INVENTORY_CORRECTION_DECREASE]: ['Audit correction', 'System sync'],
          [StockMovementReason.EXPIRED_GOODS]: ['Expired products removed', 'Quality expiry']
        };
        
        const templates = noteTemplates[reason] || ['Stock movement'];
        const notes = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate metadata based on reason
        let metadata: any = {};
        if (reason === StockMovementReason.RESTOCK) {
          metadata = {
            supplier: ['ABC Suppliers', 'XYZ Corp', 'Global Supplies'][Math.floor(Math.random() * 3)],
            batchNumber: 'BATCH-' + Math.floor(Math.random() * 10000),
            cost: Math.floor(Math.random() * 100) + 10
          };
        } else if (reason === StockMovementReason.ORDER_CONFIRMED) {
          metadata = {
            orderNumber: 'ORD-' + Math.floor(Math.random() * 10000),
            customerType: ['regular', 'premium', 'wholesale'][Math.floor(Math.random() * 3)]
          };
        }
        
        stockMovements.push({
          productId,
          warehouseId,
          movementType,
          reason,
          quantity,
          previousStock,
          newStock,
          userId,
          notes,
          metadata,
          createdAt: movementDate,
          updatedAt: movementDate,
        });
      }
    }

    // Sort movements by date (oldest first)
    stockMovements.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Insert all movements
    const insertedMovements = await StockHistory.insertMany(stockMovements);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${insertedMovements.length} dummy stock history records`,
      data: {
        productId: PRODUCT_ID,
        productName: product.name,
        userId: user._id,
        userName: user.name,
        warehousesCount: warehouses.length,
        movementsCreated: insertedMovements.length,
        dateRange: {
          from: stockMovements[0]?.createdAt,
          to: stockMovements[stockMovements.length - 1]?.createdAt
        }
      }
    });

  } catch (error: any) {
    console.error('Error creating dummy stock history:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to create dummy stock history',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Clear all stock history for the test product (useful for testing)
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Get current user from session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    // Only allow admins to delete
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can delete stock history' },
        { status: 403 }
      );
    }

    const productId = new mongoose.Types.ObjectId(PRODUCT_ID);
    
    // Delete all stock history for this product
    const deleteResult = await StockHistory.deleteMany({ productId });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} stock history records`,
      data: {
        productId: PRODUCT_ID,
        deletedCount: deleteResult.deletedCount
      }
    });

  } catch (error: any) {
    console.error('Error deleting stock history:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to delete stock history',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}