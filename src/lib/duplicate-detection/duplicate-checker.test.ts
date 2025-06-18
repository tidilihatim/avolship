import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkForDuplicateOrders, type OrderToCheck } from './duplicate-checker';
import { FieldType, LogicalOperator, TimeUnit } from '@/types/duplicate-detection';

// Mock the database
vi.mock('@/lib/db/models/order', () => ({
  default: {
    find: vi.fn(() => ({ lean: vi.fn() }))
  }
}));

vi.mock('@/lib/db/models/duplicate-settings', () => ({
  default: { findOne: vi.fn() }
}));

import Order from '@/lib/db/models/order';
import DuplicateDetectionSettings from '@/lib/db/models/duplicate-settings';

describe('Duplicate Checker - Complex Scenarios', () => {
  const baseOrder: OrderToCheck = {
    customer: {
      name: 'John Doe',
      phoneNumbers: ['+1234567890'],
      shippingAddress: '123 Main St, City, State 12345'
    },
    products: [
      { productId: 'prod1', quantity: 2, unitPrice: 25.99 },
      { productId: 'prod2', quantity: 1, unitPrice: 15.50 }
    ],
    totalPrice: 67.48,
    warehouseId: 'warehouse1',
    sellerId: 'seller1',
    orderDate: new Date('2024-01-15T10:00:00Z')
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phone Number Variations', () => {
    it('should detect duplicates with different phone formatting', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [{
          name: 'Phone Strict Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
        }]
      });

      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order1',
        orderId: 'ORD-001',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'Jane Smith',
          phoneNumbers: ['(123) 456-7890'], // Different format, same number
          shippingAddress: '456 Oak Ave'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

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

      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [{
          name: 'Multi Phone Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 2, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
        }]
      });

      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order2',
        orderId: 'ORD-002',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T08:30:00Z'),
        customer: {
          name: 'Different Customer',
          phoneNumbers: ['+9999999999', '098-765-4321'], // One number matches
          shippingAddress: 'Different Address'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(orderWithMultiplePhones);
      
      expect(result.isDuplicate).toBe(true);
    });
  });

  describe('Time Window Edge Cases', () => {
    it('should respect exact time boundaries', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
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
      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order3',
        orderId: 'ORD-003',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T08:59:59Z'), // 60 min 1 sec earlier
        customer: {
          name: 'John Doe',
          phoneNumbers: ['+9999999999'],
          shippingAddress: 'Different Address'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(false);
    });

    it('should handle mixed time units in multiple rules', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [
          {
            name: 'Short Window Rule',
            isActive: true,
            logicalOperator: LogicalOperator.AND,
            timeWindow: { value: 30, unit: TimeUnit.MINUTES },
            conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
          },
          {
            name: 'Long Window Rule',
            isActive: true,
            logicalOperator: LogicalOperator.AND,
            timeWindow: { value: 2, unit: TimeUnit.DAYS },
            conditions: [{ field: FieldType.CUSTOMER_NAME, enabled: true }]
          }
        ]
      });

      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order4',
        orderId: 'ORD-004',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-14T10:00:00Z'), // 1 day earlier
        customer: {
          name: 'John Doe',
          phoneNumbers: ['+9999999999'], // Different phone
          shippingAddress: 'Different Address'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOrders[0].matchedRule).toBe('Long Window Rule');
    });
  });

  describe('Complex Logical Operators', () => {
    it('should handle AND operator with partial matches', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
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
      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order5',
        orderId: 'ORD-005',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'John Doe',           // ✅ Matches
          phoneNumbers: ['+1234567890'], // ✅ Matches
          shippingAddress: '999 Different St' // ❌ Doesn't match
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(false); // AND requires ALL conditions
    });

    it('should handle OR operator with single match', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
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
      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order6',
        orderId: 'ORD-006',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        totalPrice: 67.48, // ✅ Matches
        customer: {
          name: 'Different Customer',      // ❌ Doesn't match
          phoneNumbers: ['+9999999999'],   // ❌ Doesn't match
          shippingAddress: 'Different Address'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true); // OR needs only ONE condition
    });
  });

  describe('Product and Warehouse Scenarios', () => {
    it('should detect duplicates with same products different quantities', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [{
          name: 'Product ID Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.PRODUCT_ID, enabled: true }]
        }]
      });

      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order7',
        orderId: 'ORD-007',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        products: [
          { productId: 'prod1', quantity: 10, unitPrice: 25.99 }, // Same product, different qty
          { productId: 'prod3', quantity: 1, unitPrice: 5.00 }    // Additional product
        ],
        customer: {
          name: 'Different Customer',
          phoneNumbers: ['+9999999999'],
          shippingAddress: 'Different Address'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true);
    });

    it('should respect warehouse boundaries', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [{
          name: 'Warehouse + Name Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [
            { field: FieldType.WAREHOUSE, enabled: true },
            { field: FieldType.CUSTOMER_NAME, enabled: true }
          ]
        }]
      });

      // Same customer, same name, but different warehouse
      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order8',
        orderId: 'ORD-008',
        sellerId: 'seller1',
        warehouseId: 'warehouse2', // Different warehouse
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'John Doe',
          phoneNumbers: ['+1234567890'],
          shippingAddress: '123 Main St, City, State 12345'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(false); // Different warehouse
    });
  });

  describe('Multiple Potential Duplicates', () => {
    it('should find all matching duplicates across different rules', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [
          {
            name: 'Phone Rule',
            isActive: true,
            logicalOperator: LogicalOperator.AND,
            timeWindow: { value: 2, unit: TimeUnit.HOURS },
            conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
          },
          {
            name: 'Address Rule',
            isActive: true,
            logicalOperator: LogicalOperator.AND,
            timeWindow: { value: 1, unit: TimeUnit.HOURS },
            conditions: [{ field: FieldType.CUSTOMER_ADDRESS, enabled: true }]
          }
        ]
      });

      const mockLean = vi.fn().mockResolvedValue([
        {
          _id: 'order9',
          orderId: 'ORD-009',
          sellerId: 'seller1',
          orderDate: new Date('2024-01-15T08:30:00Z'), // 1.5 hours earlier
          customer: {
            name: 'Different Name',
            phoneNumbers: ['+1234567890'], // Matches phone rule
            shippingAddress: 'Different Address'
          }
        },
        {
          _id: 'order10',
          orderId: 'ORD-010',
          sellerId: 'seller1',
          orderDate: new Date('2024-01-15T09:30:00Z'), // 30 min earlier
          customer: {
            name: 'Another Name',
            phoneNumbers: ['+9999999999'],
            shippingAddress: '123 Main St, City, State 12345' // Matches address rule
          }
        }
      ]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOrders).toHaveLength(2);
      expect(result.duplicateOrders.map(d => d.matchedRule)).toContain('Phone Rule');
      expect(result.duplicateOrders.map(d => d.matchedRule)).toContain('Address Rule');
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

      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [{
          name: 'Phone Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_PHONE, enabled: true }]
        }]
      });

      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order11',
        orderId: 'ORD-011',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'Some Customer',
          phoneNumbers: [''],
          shippingAddress: 'Some Address'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(orderWithEmptyPhone);
      
      expect(result.isDuplicate).toBe(false); // Empty phones shouldn't match
    });

    it('should handle case sensitivity in names correctly', async () => {
      vi.mocked(DuplicateDetectionSettings.findOne).mockResolvedValue({
        sellerId: 'seller1',
        isEnabled: true,
        rules: [{
          name: 'Name Case Rule',
          isActive: true,
          logicalOperator: LogicalOperator.AND,
          timeWindow: { value: 1, unit: TimeUnit.HOURS },
          conditions: [{ field: FieldType.CUSTOMER_NAME, enabled: true }]
        }]
      });

      const mockLean = vi.fn().mockResolvedValue([{
        _id: 'order12',
        orderId: 'ORD-012',
        sellerId: 'seller1',
        orderDate: new Date('2024-01-15T09:30:00Z'),
        customer: {
          name: 'JOHN DOE', // Different case
          phoneNumbers: ['+9999999999'],
          shippingAddress: 'Different Address'
        }
      }]);

      vi.mocked(Order.find).mockReturnValue({ lean: mockLean } as any);

      const result = await checkForDuplicateOrders(baseOrder);
      
      expect(result.isDuplicate).toBe(true); // Should be case-insensitive
    });
  });
});