// Simple duplicate order detection library
import Order from '@/lib/db/models/order';
import DuplicateDetectionSettings from '@/lib/db/models/duplicate-settings';
import { FieldType, LogicalOperator, TimeUnit } from '@/types/duplicate-detection';

// Interface for order data to check
export interface OrderToCheck {
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
  };
  products: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalPrice: number;
  warehouseId: string;
  sellerId: string;
  orderDate: Date;
  excludeOrderId?: string; // To exclude current order when updating
}

// Interface for duplicate detection result
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOrders: Array<{
    orderId: string;
    orderNumber: string;
    matchedRule: string;
  }>;
  rulesChecked: number;
  processingTime: number; // milliseconds
}

// Time conversion helper
function convertTimeToMilliseconds(value: number, unit: TimeUnit): number {
  switch (unit) {
    case TimeUnit.MINUTES:
      return value * 60 * 1000;
    case TimeUnit.HOURS:
      return value * 60 * 60 * 1000;
    case TimeUnit.DAYS:
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 60 * 1000; // default to hours
  }
}

// Field comparison functions
const fieldComparators = {
  [FieldType.CUSTOMER_NAME]: (order1: any, order2: any): boolean => {
    return order1.customer.name.toLowerCase().trim() === order2.customer.name.toLowerCase().trim();
  },

  [FieldType.CUSTOMER_PHONE]: (order1: any, order2: any): boolean => {
    const phones1 = order1.customer.phoneNumbers.map((p: string) => p.replace(/\D/g, ''));
    const phones2 = order2.customer.phoneNumbers.map((p: string) => p.replace(/\D/g, ''));
    return phones1.some((p1: string) => phones2.some((p2: string) => p1 === p2 && p1.length > 0));
  },

  [FieldType.CUSTOMER_ADDRESS]: (order1: any, order2: any): boolean => {
    const addr1 = order1.customer.shippingAddress.toLowerCase().replace(/\s+/g, ' ').trim();
    const addr2 = order2.customer.shippingAddress.toLowerCase().replace(/\s+/g, ' ').trim();
    return addr1 === addr2;
  },

  [FieldType.PRODUCT_ID]: (order1: any, order2: any): boolean => {
    const productIds1 = order1.products.map((p: any) => p.productId.toString());
    const productIds2 = order2.products.map((p: any) => p.productId.toString());
    return productIds1.some((id1: string) => productIds2.includes(id1));
  },

  [FieldType.PRODUCT_NAME]: async (order1: any, order2: any): Promise<boolean> => {
    // This would require product lookup - for now, use product ID comparison
    return fieldComparators[FieldType.PRODUCT_ID](order1, order2);
  },

  [FieldType.PRODUCT_CODE]: async (order1: any, order2: any): Promise<boolean> => {
    // This would require product lookup - for now, use product ID comparison
    return fieldComparators[FieldType.PRODUCT_ID](order1, order2);
  },

  [FieldType.ORDER_TOTAL]: (order1: any, order2: any): boolean => {
    return Math.abs(order1.totalPrice - order2.totalPrice) < 0.01; // Allow for small floating point differences
  },

  [FieldType.WAREHOUSE]: (order1: any, order2: any): boolean => {
    return order1.warehouseId.toString() === order2.warehouseId.toString();
  }
};

// Check if a rule matches between two orders
async function checkRuleMatch(rule: any, order1: any, order2: any, timeDiffMs: number): Promise<boolean> {
  // Check time window first
  const ruleTimeMs = convertTimeToMilliseconds(rule.timeWindow.value, rule.timeWindow.unit);
  
  if (timeDiffMs > ruleTimeMs) {
    return false; // Outside time window, not a duplicate
  }

  // Check conditions
  const enabledConditions = rule.conditions.filter((c: any) => c.enabled);
  if (enabledConditions.length === 0) {
    return false; // No conditions to check
  }

  const conditionResults = await Promise.all(
    enabledConditions.map(async (condition: any) => {
      const comparator = fieldComparators[condition.field as FieldType];
      if (!comparator) return false;
      
      // Handle async comparators (for product name/code lookup)
      if (typeof comparator === 'function' && comparator.constructor.name === 'AsyncFunction') {
        return await comparator(order1, order2);
      } else {
        return (comparator as Function)(order1, order2);
      }
    })
  );

  // Apply logical operator
  if (rule.logicalOperator === LogicalOperator.AND) {
    return conditionResults.every(result => result === true);
  } else { // OR
    return conditionResults.some(result => result === true);
  }
}

// Main duplicate detection function
export async function checkForDuplicateOrders(orderToCheck: OrderToCheck): Promise<DuplicateDetectionResult> {
  const startTime = Date.now();
  
  try {
    // Get seller's duplicate detection settings
    const settings = await DuplicateDetectionSettings.findOne({ 
      sellerId: orderToCheck.sellerId 
    });

    if (!settings || !settings.isEnabled) {
      return {
        isDuplicate: false,
        duplicateOrders: [],
        rulesChecked: 0,
        processingTime: Date.now() - startTime
      };
    }

    // Get active rules
    const activeRules = settings.rules.filter((rule: any) => rule.isActive);
    
    // If no active rules, use default time window for basic check
    if (activeRules.length === 0) {
      return await performDefaultDuplicateCheck(orderToCheck, settings.defaultTimeWindow, startTime);
    }

    // Calculate the maximum time window from all rules
    const maxTimeWindow = Math.max(
      ...activeRules.map((rule: any) => 
        convertTimeToMilliseconds(rule.timeWindow.value, rule.timeWindow.unit)
      )
    );

    // Find potential duplicate orders within the maximum time window
    const timeWindowStart = new Date(orderToCheck.orderDate.getTime() - maxTimeWindow);
    const timeWindowEnd = new Date(orderToCheck.orderDate.getTime() + maxTimeWindow);

    const query: any = {
      sellerId: orderToCheck.sellerId,
      orderDate: {
        $gte: timeWindowStart,
        $lte: timeWindowEnd
      }
    };

    // Exclude current order if updating existing order
    if (orderToCheck.excludeOrderId) {
      query._id = { $ne: orderToCheck.excludeOrderId };
    }

    const potentialDuplicates = await Order.find(query).lean();

    const duplicateOrders: any[] = [];

    // Check each potential duplicate against all rules
    for (const potentialDupe of potentialDuplicates) {
      const timeDiffMs = Math.abs(
        orderToCheck.orderDate.getTime() - new Date(potentialDupe.orderDate).getTime()
      );

      // Check against each active rule
      for (const rule of activeRules) {
        const isMatch = await checkRuleMatch(rule, orderToCheck, potentialDupe, timeDiffMs);
        
        if (isMatch) {
          // Found a duplicate according to this rule
          duplicateOrders.push({
            orderId: (potentialDupe._id as any).toString(),
            orderNumber: potentialDupe.orderId,
            matchedRule: rule.name
          });
          break; // No need to check other rules for this order
        }
      }
    }

    return {
      isDuplicate: duplicateOrders.length > 0,
      duplicateOrders,
      rulesChecked: activeRules.length,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Error checking for duplicate orders:', error);
    return {
      isDuplicate: false,
      duplicateOrders: [],
      rulesChecked: 0,
      processingTime: Date.now() - startTime
    };
  }
}

// Fallback function for default duplicate checking when no rules are configured
async function performDefaultDuplicateCheck(
  orderToCheck: OrderToCheck, 
  defaultTimeWindow: any, 
  startTime: number
): Promise<DuplicateDetectionResult> {
  const timeWindowMs = convertTimeToMilliseconds(defaultTimeWindow.value, defaultTimeWindow.unit);
  const timeWindowStart = new Date(orderToCheck.orderDate.getTime() - timeWindowMs);
  const timeWindowEnd = new Date(orderToCheck.orderDate.getTime() + timeWindowMs);

  const query: any = {
    sellerId: orderToCheck.sellerId,
    orderDate: {
      $gte: timeWindowStart,
      $lte: timeWindowEnd
    },
    $or: [
      { 'customer.name': { $regex: new RegExp(orderToCheck.customer.name, 'i') } },
      { 'customer.phoneNumbers': { $in: orderToCheck.customer.phoneNumbers } }
    ]
  };

  // Exclude current order if updating existing order
  if (orderToCheck.excludeOrderId) {
    query._id = { $ne: orderToCheck.excludeOrderId };
  }

  const potentialDuplicates = await Order.find(query).lean();

  const duplicateOrders = potentialDuplicates.map(order => ({
    orderId: (order._id as any).toString(),
    orderNumber: order.orderId,
    matchedRule: 'Default Rule (Customer Name OR Phone)'
  }));

  return {
    isDuplicate: duplicateOrders.length > 0,
    duplicateOrders,
    rulesChecked: 1,
    processingTime: Date.now() - startTime
  };
}

// Helper function to check duplicates for an existing order (used when creating orders)
export async function checkDuplicatesForNewOrder(orderData: {
  customer: { name: string; phoneNumbers: string[]; shippingAddress: string };
  products: Array<{ productId: string; quantity: number; unitPrice: number }>;
  totalPrice: number;
  warehouseId: string;
  sellerId: string;
}): Promise<DuplicateDetectionResult> {
  return await checkForDuplicateOrders({
    ...orderData,
    orderDate: new Date()
  });
}