import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { getProductsForOrder } from '@/app/actions/order';
import { processFile } from '@/app/dashboard/seller/orders/import/_components/file-processor';

// Mock the dependencies
vi.mock('@/app/actions/order', () => ({
  getProductsForOrder: vi.fn()
}));

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn()
  }
}));

// Mock FileReader globally
const mockFileReader = {
  readAsText: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  onload: null as any,
  onerror: null as any,
  result: null as any
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader)
});

// Helper function to create mock File objects
const createMockFile = (content: string, name: string, type: string = 'text/csv'): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

// Mock product data for testing
const mockProducts = [
  {
    _id: 'product-1',
    name: 'Test Product 1',
    code: 'PROD001',
    status: 'active',
    warehouses: [
      {
        warehouseId: 'warehouse-1',
        stock: 100
      }
    ],
    availableExpeditions: [
      {
        _id: 'exp-1',
        expeditionCode: 'EXP001',
        status: 'approved',
        unitPrice: 10.99
      }
    ]
  },
  {
    _id: 'product-2',
    name: 'Test Product 2',
    code: 'PROD002',
    status: 'active',
    warehouses: [
      {
        warehouseId: 'warehouse-1',
        stock: 50
      }
    ],
    availableExpeditions: [
      {
        _id: 'exp-2',
        expeditionCode: 'EXP002',
        status: 'approved',
        unitPrice: 25.50
      }
    ]
  }
];

describe('processFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset FileReader mock
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
    mockFileReader.result = null;
  });

  describe('CSV File Processing', () => {
    it('should successfully process a valid CSV file', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD001,PROD001,2024-01-15,Test Product 1,http://example.com,John Doe,+1234567890,123 Main St,10.99,2,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      // Mock FileReader for CSV
      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        // Simulate async file reading
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
      expect(result.errorRows).toBe(0);
      expect(result.orders).toHaveLength(1);
      
      const order = result.orders[0];
      expect(order.orderId).toBe('ORD001');
      expect(order.customer.name).toBe('John Doe');
      expect(order.products).toHaveLength(1);
      expect(order.products[0].id).toBe('PROD001');
      expect(order.products[0].quantity).toBe(2);
      expect(order.products[0].price).toBe(10.99);
      expect(order.errors).toHaveLength(0);
    });

    it('should handle CSV with multiple products in one order', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD002,PROD001|PROD002,2024-01-15,Test Product 1|Test Product 2,http://example.com,Jane Doe,+1234567890,456 Oak St,10.99|25.50,1|3,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.orders[0].products).toHaveLength(2);
      expect(result.orders[0].products[0].id).toBe('PROD001');
      expect(result.orders[0].products[1].id).toBe('PROD002');
      expect(result.orders[0].products[1].quantity).toBe(3);
    });

    it('should return error for file with insufficient rows', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME`;
      
      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('File must contain at least a header row and one data row');
      expect(result.totalRows).toBe(0);
      expect(result.validRows).toBe(0);
      expect(result.errorRows).toBe(0);
    });

    it('should return error for invalid headers', async () => {
      // Arrange
      const csvContent = `INVALID HEADER,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD001,PROD001,2024-01-15,Test Product 1,http://example.com,John Doe,+1234567890,123 Main St,10.99,2,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Column 1 should be "ORDER ID" but found "INVALID HEADER"');
      expect(result.errorRows).toBe(1);
    });

    it('should handle missing required fields', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
,PROD001,2024-01-15,Test Product 1,http://example.com,,+1234567890,123 Main St,10.99,2,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.validRows).toBe(0);
      expect(result.errorRows).toBe(1);
      
      const order = result.orders[0];
      expect(order.errors).toContain('Order ID is required');
      expect(order.errors).toContain('Customer Name is required');
    });

    it('should handle invalid price values', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD003,PROD001,2024-01-15,Test Product 1,http://example.com,John Doe,+1234567890,123 Main St,invalid_price,5,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errorRows).toBe(1);
      
      const order = result.orders[0];
      expect(order.errors).toContain('Invalid price "invalid_price" for product PROD001');
    });

    it('should handle invalid quantity values', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD003b,PROD001,2024-01-15,Test Product 1,http://example.com,John Doe,+1234567890,123 Main St,10.99,invalid_qty,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errorRows).toBe(1);
      
      const order = result.orders[0];
      expect(order.errors).toContain('Invalid quantity "invalid_qty" for product PROD001');
    });

    it('should detect non-existent products', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD004,NONEXISTENT,2024-01-15,Non-existent Product,http://example.com,John Doe,+1234567890,123 Main St,10.99,1,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errorRows).toBe(1);
      
      const order = result.orders[0];
      expect(order.errors).toContain('Product "NONEXISTENT" does not exist in selected warehouse');
    });

    it('should detect insufficient stock and add warnings', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD005,PROD002,2024-01-15,Test Product 2,http://example.com,John Doe,+1234567890,123 Main St,25.50,100,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.validRows).toBe(1); // Should still be valid, just with warnings
      
      const order = result.orders[0];
      expect(order.warnings).toContain('Product "PROD002" has insufficient stock (available: 50, requested: 100)');
    });

    it('should handle product with no approved expeditions', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD006,PROD003,2024-01-15,Test Product 3,http://example.com,John Doe,+1234567890,123 Main St,10.99,1,Test Store`;

      const productWithoutExpeditions = {
        _id: 'product-3',
        name: 'Test Product 3',
        code: 'PROD003',
        status: 'active',
        warehouses: [
          {
            warehouseId: 'warehouse-1',
            stock: 100
          }
        ],
        availableExpeditions: [] // No expeditions
      };

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue([...mockProducts, productWithoutExpeditions]);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errorRows).toBe(1);
      
      const order = result.orders[0];
      expect(order.errors).toContain('Product "PROD003" has no approved expeditions in selected warehouse');
    });
  });

  describe('Error Handling', () => {
    it('should handle FileReader errors', async () => {
      // Arrange
      const file = createMockFile('some content', 'orders.csv');
      const warehouseId = 'warehouse-1';

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          if (reader.onerror) {
            reader.onerror(new Error('File read error') as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process file');
    });

    it('should handle getProductsForOrder failure', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD001,PROD001,2024-01-15,Test Product 1,http://example.com,John Doe,+1234567890,123 Main St,10.99,2,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockRejectedValue(new Error('Database error'));

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to fetch available products for validation');
    });

    it('should handle malformed product arrays', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD007,PROD001|PROD002,2024-01-15,Test Product 1,http://example.com,John Doe,+1234567890,123 Main St,10.99|25.50,1,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errorRows).toBe(1);
      
      const order = result.orders[0];
      expect(order.errors).toContain('Product IDs, names, prices, and quantities must have the same number of items when separated by |');
    });
  });

  describe('Excel File Processing', () => {
    it('should handle Excel files', async () => {
      // Arrange
      const file = createMockFile('mock excel content', 'orders.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const warehouseId = 'warehouse-1';

      const mockExcelData = [
        ['ORDER ID', 'PRODUCT ID', 'DATE', 'PRODUCT NAME', 'PRODUCT LINK', 'CUSTOMER NAME', 'PHONE NUMBER', 'ADDRESS', 'PRICE', 'QUANTITY', 'STORE NAME'],
        ['ORD001', 'PROD001', '2024-01-15', 'Test Product 1', 'http://example.com', 'John Doe', '+1234567890', '123 Main St', '10.99', '2', 'Test Store']
      ];

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      // Mock XLSX
      const XLSX = await import('xlsx');
      vi.mocked(XLSX.read).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      } as any);

      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockExcelData);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = new ArrayBuffer(8);
          if (reader.onload) {
            reader.onload({ target: { result: new ArrayBuffer(8) } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.validRows).toBe(1);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].orderId).toBe('ORD001');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file', async () => {
      // Arrange
      const file = createMockFile('', 'empty.csv');
      const warehouseId = 'warehouse-1';

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = '';
          if (reader.onload) {
            reader.onload({ target: { result: '' } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('File must contain at least a header row and one data row');
    });

    it('should handle CSV with quoted values containing commas', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD008,PROD001,2024-01-15,Test Product 1,http://example.com,"Doe, John",+1234567890,"123 Main St, Apt 2",10.99,1,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      (getProductsForOrder as Mock).mockResolvedValue(mockProducts);

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.validRows).toBe(1);
      expect(result.orders[0].customer.name).toBe('Doe, John');
      expect(result.orders[0].customer.address).toBe('123 Main St, Apt 2');
    });

    it('should handle non-array response from getProductsForOrder', async () => {
      // Arrange
      const csvContent = `ORDER ID,PRODUCT ID,DATE,PRODUCT NAME,PRODUCT LINK,CUSTOMER NAME,PHONE NUMBER,ADDRESS,PRICE,QUANTITY,STORE NAME
ORD009,PROD001,2024-01-15,Test Product 1,http://example.com,John Doe,+1234567890,123 Main St,10.99,1,Test Store`;

      const file = createMockFile(csvContent, 'orders.csv');
      const warehouseId = 'warehouse-1';

      // Return a non-array response
      (getProductsForOrder as Mock).mockResolvedValue({ data: mockProducts });

      vi.mocked(FileReader).mockImplementation(() => {
        const reader = mockFileReader;
        setTimeout(() => {
          reader.result = csvContent;
          if (reader.onload) {
            reader.onload({ target: { result: csvContent } } as any);
          }
        }, 0);
        return reader as any;
      });

      // Act
      const result = await processFile(file, warehouseId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errorRows).toBe(1); // Should error because no products are available
      
      const order = result.orders[0];
      expect(order.errors).toContain('Product "PROD001" does not exist in selected warehouse');
    });
  });
});