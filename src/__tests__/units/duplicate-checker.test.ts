import { describe, it, expect, beforeEach } from 'vitest';
import { checkForDuplicateOrders, type OrderToCheck } from '../../lib/duplicate-detection/duplicate-checker';
import { FieldType, LogicalOperator, TimeUnit } from '@/types/duplicate-detection';
import { createTestData } from '../utils/test-database';
import Order from '@/lib/db/models/order';
import DuplicateDetectionSettings from '@/lib/db/models/duplicate-settings';
import mongoose from 'mongoose';

describe('Duplicate Checker - Complex Scenarios with Real Database', () => {
  let testSeller: any;
  let baseOrder: OrderToCheck;
  const warehouseId = new mongoose.Types.ObjectId();
  const expeditionId = new mongoose.Types.ObjectId();
  const productId1 = new mongoose.Types.ObjectId();

  // Helper function to create test orders with all required fields
  const createTestOrder = (overrides: any = {}) => {
    const defaultOrder = {
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      customer: {
        name: 'John Doe',
        phoneNumbers: ['+1234567890'],
        shippingAddress: '123 Main St, City, State 12345'
      },
      warehouseId,
      sellerId: testSeller._id,
      products: [
        {
          productId: productId1,
          quantity: 2,
          unitPrice: 25.99,
          expeditionId
        }
      ],
      totalPrice: 51.98,
      orderDate: new Date('2024-01-15T10:00:00Z')
    };

    return {
      ...defaultOrder,
      ...overrides,
      customer: {
        ...defaultOrder.customer,
        ...overrides.customer
      },
      products: overrides.products || defaultOrder.products
    };
  };

  beforeEach(async () => {
    // Create a test seller for each test
    testSeller = await createTestData.user({
      name: 'Test Seller',
      role: 'seller'
    });

    baseOrder = {
      customer: {
        name: 'John Doe',
        phoneNumbers: ['+1234567890'],
        shippingAddress: '123 Main St, City, State 12345'
      },
      products: [
        { productId: productId1.toString(), quantity: 2, unitPrice: 25.99 }
      ],
      totalPrice: 51.98,
      warehouseId: warehouseId.toString(),
      sellerId: testSeller._id.toString(),
      orderDate: new Date('2024-01-15T10:00:00Z')
    };
  });

  describe('Phone Number Variations', () => {
    it('should detect duplicates with different phone formatting', async () => {
      // Create real duplicate detection settings
      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: true,
        rules: [{
          name: 'Phone Strict Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
        }]
      });

      // Create real order in database
      await Order.create(createTestOrder({
        orderId: 'ORD-001',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'Jane Smith',
          phoneNumbers: ['(123) 456-7890'], // Different format, same number
          shippingAddress: '456 Oak Ave'
        }
      }));

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOrders[0].matchedRule).toBe('Phone Strict Rule');
    });

    it('should handle multiple phone numbers correctly', async () => {
      const orderWithMultiplePhones = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          phoneNumbers: ['+1234567890', '+0987654321', '+5555555555']
        }
      };

      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: true,
        rules: [{
          name: 'Multi Phone Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 2, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
        }]
      });

      await Order.create(createTestOrder({
        orderId: 'ORD-002',
        orderDate: new Date('2024-01-15T08:30:00Z'),
        customer: {
          name: 'Different Customer',
          phoneNumbers: ['+9999999999', '098-765-4321'], // One number matches
          shippingAddress: 'Different Address'
        }
      }));

      const result = await checkForDuplicateOrders(orderWithMultiplePhones);
      
      expect(result.isDuplicate).toBe(true);
    });
  });

  describe('Customer Name Scenarios', () => {
    it('should handle case sensitivity in names correctly', async () => {
      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: true,
        rules: [{
          name: 'Name Case Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_NAME, enabled: true }]
        }]
      });

      await Order.create(createTestOrder({
        orderId: 'ORD-003',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'JOHN DOE', // Different case
          phoneNumbers: ['+9999999999'],
          shippingAddress: 'Different Address'
        }
      }));

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true); // Should be case-insensitive
    });
  });

  describe('Time Window Edge Cases', () => {
    it('should respect exact time boundaries', async () => {
      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: true,
        rules: [{
          name: 'Exact Boundary Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 60, unit: TimeUnit.MINUTES },
          conditions: [{ field: FieldType.CUSTOMER_NAME, enabled: true }]
        }]
      });

      // Order exactly 60 minutes and 1 second earlier (should NOT be duplicate)
      await Order.create(createTestOrder({
        orderId: 'ORD-004',
        orderDate: new Date('2024-01-15T08:58:59Z'), // 60 min 1 sec earlier
        customer: {
          name: 'John Doe',
          phoneNumbers: ['+9999999999'],
          shippingAddress: 'Different Address'
        }
      }));

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('Logical Operators', () => {
    it('should handle AND operator with partial matches', async () => {
      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: true,
        rules: [{
          name: 'Strict AND Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [
            { field: FieldType.CUSTOMER_NAME, enabled: true },
            { field: FieldType.CUSTOMER_PHONE, enabled: true },
            { field: FieldType.CUSTOMER_ADDRESS, enabled: true }
          ]
        }]
      });

      // Order matches name and phone but NOT address
      await Order.create(createTestOrder({
        orderId: 'ORD-005',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'John Doe',           // ✅ Matches
          phoneNumbers: ['+1234567890'], // ✅ Matches
          shippingAddress: '999 Different St' // ❌ Doesn't match
        }
      }));

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(false); // AND requires ALL conditions
    });

    it('should handle OR operator with single match', async () => {
      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: true,
        rules: [{
          name: 'Flexible OR Rule',
          isActive: true,
          logicalOperator: LogicalOperator.OR,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [
            { field: FieldType.CUSTOMER_NAME, enabled: true },
            { field: FieldType.CUSTOMER_PHONE, enabled: true },
            { field: FieldType.ORDER_TOTAL, enabled: true }
          ]
        }]
      });

      // Order matches ONLY the total price
      await Order.create(createTestOrder({
        orderId: 'ORD-006',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        totalPrice: 51.98, // ✅ Matches
        customer: {
          name: 'Different Customer',      // ❌ Doesn't match
          phoneNumbers: ['+9999999999'],   // ❌ Doesn't match
          shippingAddress: 'Different Address'
        }
      }));

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true); // OR needs only ONE condition
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty phone numbers gracefully', async () => {
      const orderWithEmptyPhone = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          phoneNumbers: [''] // Empty phone number
        }
      };

      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: true,
        rules: [{
          name: 'Phone Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
        }]
      });

      await Order.create(createTestOrder({
        orderId: 'ORD-007',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'Some Customer',
          phoneNumbers: ['+1111111111'], // Valid but different phone
          shippingAddress: 'Some Address'
        }
      }));

      const result = await checkForDuplicateOrders(orderWithEmptyPhone);
      
      expect(result.isDuplicate).toBe(false); // Empty phones shouldn't match
    });

    it('should handle no settings found', async () => {
      // Don't create any settings - test should handle gracefully
      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(false);
      expect(result.duplicateOrders).toHaveLength(0);
      expect(result.rulesChecked).toBe(0);
    });

    it('should handle disabled detection', async () => {
      await DuplicateDetectionSettings.create({
        sellerId: testSeller._id,
        isEnabled: false, // Detection disabled
        rules: [{
          name: 'Disabled Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
        }]
      });

      await Order.create(createTestOrder({
        customer: {
          name: 'John Doe',
          phoneNumbers: ['+1234567890'], // Same phone
          shippingAddress: 'Same Address'
        }
      }));

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(false); // Should be false because detection is disabled
    });
  });
});