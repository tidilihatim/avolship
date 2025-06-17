import { ParsedOrder, ParsedProduct } from './order-preview';
import { getProductsForOrder } from '@/app/actions/order';
import * as XLSX from 'xlsx';

interface ImportProductOption {
  _id: string;
  name: string;
  code: string;
  status: string;
  warehouses: {
    warehouseId: string;
    stock: number;
  }[];
  availableExpeditions: {
    _id: string;
    expeditionCode: string;
    status: string;
    unitPrice: number;
  }[];
}

export interface FileProcessingResult {
  success: boolean;
  orders: ParsedOrder[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  message?: string;
}

// Expected CSV columns in order
const EXPECTED_COLUMNS = [
  'ORDER ID',
  'PRODUCT ID', 
  'DATE',
  'PRODUCT NAME',
  'PRODUCT LINK',
  'CUSTOMER NAME',
  'PHONE NUMBER',
  'ADDRESS',
  'PRICE',
  'QUANTITY',
  'STORE NAME'
];

export async function processFile(file: File, warehouseId: string): Promise<FileProcessingResult> {
  try {
    let rows: string[][];
    
    // Check file type and parse accordingly
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel file
      rows = await parseExcelFile(file);
    } else {
      // Parse CSV file
      const text = await readFileAsText(file);
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        return {
          success: false,
          orders: [],
          totalRows: 0,
          validRows: 0,
          errorRows: 0,
          message: 'File must contain at least a header row and one data row'
        };
      }
      
      rows = lines.map(line => parseCSVLine(line));
    }
    
    if (rows.length < 2) {
      return {
        success: false,
        orders: [],
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        message: 'File must contain at least a header row and one data row'
      };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Validate headers
    const headerValidation = validateHeaders(headers);
    if (!headerValidation.valid) {
      return {
        success: false,
        orders: [],
        totalRows: dataRows.length,
        validRows: 0,
        errorRows: dataRows.length,
        message: headerValidation.message
      };
    }

    // Get available products for the warehouse
    let availableProducts: ImportProductOption[] = [];
    try {
      const productResult = await getProductsForOrder(warehouseId);
      
      availableProducts = Array.isArray(productResult) ? productResult as unknown as ImportProductOption[] : [];
      
    } catch (error) {
      return {
        success: false,
        orders: [],
        totalRows: dataRows.length,
        validRows: 0,
        errorRows: dataRows.length,
        message: 'Failed to fetch available products for validation'
      };
    }

    // Process each data row
    const orders: ParsedOrder[] = [];
    let validCount = 0;
    let errorCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowIndex = i + 2; // +2 because we skip header and arrays are 0-indexed
      
      const orderResult = await processOrderRow(row, rowIndex, availableProducts, warehouseId);
      orders.push(orderResult.order);
      
      if (orderResult.order.errors.length === 0) {
        validCount++;
      } else {
        errorCount++;
      }
    }

    return {
      success: true,
      orders,
      totalRows: dataRows.length,
      validRows: validCount,
      errorRows: errorCount
    };

  } catch (error) {
    return {
      success: false,
      orders: [],
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });
}

async function parseExcelFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          reject(new Error('Failed to read Excel file'));
          return;
        }
        
        // Parse the Excel file
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays (rows and columns)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, // Use array of arrays format
          defval: '', // Default value for empty cells
          raw: false // Format values as strings
        }) as string[][];
        
        // Filter out empty rows
        const filteredData = jsonData.filter(row => 
          row.some(cell => cell && cell.toString().trim() !== '')
        );
        
        // Ensure all rows have the same number of columns as expected
        const maxColumns = EXPECTED_COLUMNS.length;
        const paddedData = filteredData.map(row => {
          const paddedRow = [...row];
          while (paddedRow.length < maxColumns) {
            paddedRow.push('');
          }
          return paddedRow.slice(0, maxColumns); // Trim to expected columns
        });
        
        resolve(paddedData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  // Handle BOM if present
  if (line.charCodeAt(0) === 0xFEFF) {
    line = line.substring(1);
  }
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  
  // Ensure we have the expected number of columns
  while (result.length < EXPECTED_COLUMNS.length) {
    result.push('');
  }
  
  return result;
}

function validateHeaders(headers: string[]): { valid: boolean; message?: string } {
  if (headers.length !== EXPECTED_COLUMNS.length) {
    return {
      valid: false,
      message: `Expected ${EXPECTED_COLUMNS.length} columns, but found ${headers.length}. Please check your file structure.`
    };
  }

  const normalizedHeaders = headers.map(h => h.toUpperCase().trim());
  const normalizedExpected = EXPECTED_COLUMNS.map(h => h.toUpperCase());

  for (let i = 0; i < normalizedExpected.length; i++) {
    if (normalizedHeaders[i] !== normalizedExpected[i]) {
      return {
        valid: false,
        message: `Column ${i + 1} should be "${EXPECTED_COLUMNS[i]}" but found "${headers[i]}"`
      };
    }
  }

  return { valid: true };
}

async function processOrderRow(
  row: string[], 
  rowIndex: number, 
  availableProducts: ImportProductOption[],
  warehouseId: string
): Promise<{ order: ParsedOrder }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract data from row
  const [
    orderId,
    productIds,
    date,
    productNames,
    productLinks,
    customerName,
    phoneNumber,
    address,
    prices,
    quantities,
    storeName
  ] = row;

  // Validate required fields
  if (!orderId?.trim()) errors.push('Order ID is required');
  if (!productIds?.trim()) errors.push('Product ID is required');
  if (!date?.trim()) errors.push('Date is required');
  if (!productNames?.trim()) errors.push('Product Name is required');
  if (!customerName?.trim()) errors.push('Customer Name is required');
  if (!phoneNumber?.trim()) errors.push('Phone Number is required');
  if (!address?.trim()) errors.push('Address is required');
  if (!prices?.trim()) errors.push('Price is required');
  if (!quantities?.trim()) errors.push('Quantity is required');
  if (!storeName?.trim()) errors.push('Store Name is required');

  // Parse products
  const products: ParsedProduct[] = [];
  if (productIds && productNames && prices && quantities) {
    const productIdArray = productIds.split('|').map(s => s.trim());
    const productNameArray = productNames.split('|').map(s => s.trim());
    const priceArray = prices.split('|').map(s => s.trim());
    const quantityArray = quantities.split('|').map(s => s.trim());

    // Validate arrays have same length
    if (productIdArray.length !== productNameArray.length ||
        productIdArray.length !== priceArray.length ||
        productIdArray.length !== quantityArray.length) {
      errors.push('Product IDs, names, prices, and quantities must have the same number of items when separated by |');
    } else {
      // Process each product
      for (let i = 0; i < productIdArray.length; i++) {
        const productId = productIdArray[i];
        const productName = productNameArray[i];
        const priceStr = priceArray[i];
        const quantityStr = quantityArray[i];

        // Skip empty product IDs
        if (!productId || productId.trim() === '') {
          errors.push(`Product ID cannot be empty at position ${i + 1}`);
          continue;
        }

        // Validate price and quantity
        const price = parseFloat(priceStr);
        const quantity = parseInt(quantityStr);

        if (isNaN(price) || price <= 0) {
          errors.push(`Invalid price "${priceStr}" for product ${productId}`);
          continue;
        }

        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`Invalid quantity "${quantityStr}" for product ${productId}`);
          continue;
        }

        // Find product in available products (with safety check)
        let availableProduct = null;
        if (Array.isArray(availableProducts) && availableProducts.length > 0) {
          
          availableProduct = availableProducts.find(p => {
            if (!p) return false;
            const codeMatch = p.code === productId;
            const idMatch = p._id === productId;
            return codeMatch || idMatch;
          });
          
        }

        if (!availableProduct) {
          errors.push(`Product "${productId}" does not exist in selected warehouse`);
        } else {
          
          // Check if product has approved expeditions - this should be an error, not warning
          if (!availableProduct.availableExpeditions || availableProduct.availableExpeditions.length === 0) {
            errors.push(`Product "${productId}" has no approved expeditions in selected warehouse`);
          }

          // Check stock (with safety check)
          if (Array.isArray(availableProduct.warehouses)) {
            const warehouseStock = availableProduct.warehouses.find(w => 
              w && w.warehouseId === warehouseId
            );
            if (warehouseStock && warehouseStock.stock < quantity) {
              warnings.push(`Product "${productId}" has insufficient stock (available: ${warehouseStock.stock}, requested: ${quantity})`);
            }
          }
        }

        products.push({
          id: productId,
          name: productName,
          quantity,
          price
        });
      }
    }
  }

  // Date validation removed as requested

  const order: ParsedOrder = {
    orderId: orderId || '',
    products,
    date: date || '',
    customer: {
      name: customerName || '',
      phone: phoneNumber || '',
      address: address || ''
    },
    storeName: storeName || '',
    rowIndex,
    errors,
    warnings
  };

  return { order };
}

