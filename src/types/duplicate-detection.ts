// Types for duplicate order detection settings

export enum FieldType {
  CUSTOMER_NAME = 'customer.name',
  CUSTOMER_PHONE = 'customer.phoneNumbers',
  CUSTOMER_ADDRESS = 'customer.shippingAddress',
  PRODUCT_ID = 'products.productId',
  PRODUCT_NAME = 'products.name',
  PRODUCT_CODE = 'products.code',
  ORDER_TOTAL = 'totalPrice',
  WAREHOUSE = 'warehouseId'
}

export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR'
}

export enum TimeUnit {
  MINUTES = 'minutes',
  HOURS = 'hours', 
  DAYS = 'days'
}

export interface DuplicateCondition {
  id: string;
  field: FieldType;
  enabled: boolean;
}

export interface DuplicateDetectionRule {
  id: string;
  name: string;
  conditions: DuplicateCondition[];
  logicalOperator: LogicalOperator;
  timeWindow: {
    value: number;
    unit: TimeUnit;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DuplicateDetectionSettings {
  sellerId: string;
  rules: DuplicateDetectionRule[];
  defaultTimeWindow: {
    value: number;
    unit: TimeUnit;
  };
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Field options for the UI
export const AVAILABLE_FIELDS = [
  {
    value: FieldType.CUSTOMER_NAME,
    label: 'Customer Name',
    description: 'Compare customer names (case-insensitive)',
    category: 'Customer'
  },
  {
    value: FieldType.CUSTOMER_PHONE,
    label: 'Customer Phone',
    description: 'Compare phone numbers',
    category: 'Customer'
  },
  {
    value: FieldType.CUSTOMER_ADDRESS,
    label: 'Shipping Address',
    description: 'Compare shipping addresses',
    category: 'Customer'
  },
  {
    value: FieldType.PRODUCT_ID,
    label: 'Product ID',
    description: 'Compare exact product IDs',
    category: 'Product'
  },
  {
    value: FieldType.ORDER_TOTAL,
    label: 'Order Total',
    description: 'Compare total order amount',
    category: 'Order'
  },
  {
    value: FieldType.WAREHOUSE,
    label: 'Warehouse',
    description: 'Compare warehouse locations',
    category: 'Order'
  }
];

export const TIME_UNIT_OPTIONS = [
  { value: TimeUnit.MINUTES, label: 'Minutes' },
  { value: TimeUnit.HOURS, label: 'Hours' },
  { value: TimeUnit.DAYS, label: 'Days' }
];

export const LOGICAL_OPERATOR_OPTIONS = [
  { 
    value: LogicalOperator.AND, 
    label: 'AND', 
    description: 'All selected conditions must match' 
  },
  { 
    value: LogicalOperator.OR, 
    label: 'OR', 
    description: 'Any selected condition can match' 
  }
];