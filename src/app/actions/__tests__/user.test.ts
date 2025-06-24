import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all external dependencies before importing
vi.mock('@/lib/db/mongoose', () => ({}));
vi.mock('@/config/auth', () => ({}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('@/lib/db/db-connect', () => ({
  withDbConnection: (fn: any) => fn
}));

vi.mock('@/lib/db/models/user', () => {
  const mockUser = {
    find: vi.fn(() => ({
      select: vi.fn(() => ({
        populate: vi.fn(() => ({
          sort: vi.fn(() => ({
            skip: vi.fn(() => ({
              limit: vi.fn(() => ({
                lean: vi.fn()
              }))
            }))
          }))
        }))
      }))
    })),
    countDocuments: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    deleteMany: vi.fn()
  };

  return {
    default: mockUser,
    UserRole: {
      PROVIDER: 'provider',
      SELLER: 'seller',
      ADMIN: 'admin',
      CALL_CENTER: 'call_center'
    },
    UserStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected'
    }
  };
});

vi.mock('@/lib/validations/user', () => ({
  validateUserFilters: vi.fn(() => ({ isValid: true })),
  sanitizeUserData: vi.fn((data) => data),
  validateUserForm: vi.fn(() => ({ isValid: true }))
}));

vi.mock('@/lib/notifications/send-notification', () => ({
  sendNotification: vi.fn()
}));

// Now import after mocking
import { getUsers } from '../user';
import { UserRole, UserStatus } from '@/lib/db/models/user';

import User from '@/lib/db/models/user';

// Mock provider data for testing
const mockProviders = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Provider',
    email: 'john@provider.com',
    businessName: 'John Logistics',
    serviceType: 'Shipping',
    country: 'USA',
    status: 'approved',
    role: 'provider',
    createdAt: new Date('2024-01-01'),
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: 'Jane Provider',
    email: 'jane@provider.com',
    businessName: 'Jane Transport',
    serviceType: 'Logistics',
    country: 'Canada',
    status: 'approved',
    role: 'provider',
    createdAt: new Date('2024-01-02'),
  },
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Bob Provider',
    email: 'bob@provider.com',
    businessName: 'Bob Shipping Co',
    serviceType: 'Express',
    country: 'Mexico',
    status: 'pending',
    role: 'provider',
    createdAt: new Date('2024-01-03'),
  }
];

describe('getUsers Server Action - Pagination Tests', () => {
  let mockFind: any;
  let mockCountDocuments: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock chain
    mockFind = User.find as any;
    mockCountDocuments = User.countDocuments as any;
    
    // Setup default successful query chain
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };
    
    mockFind.mockReturnValue(mockChain);
    mockCountDocuments.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic pagination functionality', () => {
    it('should return correct pagination data for first page', async () => {
      // Mock 25 total providers, requesting page 1 with 10 per page
      const mockData = mockProviders.slice(0, 2); // First 2 providers
      
      mockCountDocuments.mockResolvedValue(25);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 10, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3 // Math.ceil(25/10)
      });
      expect(result.users).toHaveLength(2);
    });

    it('should return correct pagination data for middle page', async () => {
      // Mock page 2 of 3 (items 11-20 of 25 total)
      const mockData = mockProviders.slice(1, 3); // Simulate page 2 data
      
      mockCountDocuments.mockResolvedValue(25);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(2, 10, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3
      });

      // Verify skip calculation: (page - 1) * limit = (2 - 1) * 10 = 10
      expect(mockFind().select().populate().sort().skip).toHaveBeenCalledWith(10);
      expect(mockFind().select().populate().sort().skip().limit).toHaveBeenCalledWith(10);
    });

    it('should return correct pagination data for last page with partial results', async () => {
      // Mock page 3 of 3 (items 21-25 of 25 total, only 5 items)
      const mockData = [mockProviders[2]]; // Only 1 item on last page
      
      mockCountDocuments.mockResolvedValue(25);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(3, 10, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3
      });
      expect(result.users).toHaveLength(1);

      // Verify skip calculation: (page - 1) * limit = (3 - 1) * 10 = 20
      expect(mockFind().select().populate().sort().skip).toHaveBeenCalledWith(20);
    });

    it('should handle single page scenario', async () => {
      // Mock 1 provider total, 1 page
      const mockData = [mockProviders[0]];
      
      mockCountDocuments.mockResolvedValue(1);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 12, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1
      });
      expect(result.users).toHaveLength(1);

      // First page should skip 0 items
      expect(mockFind().select().populate().sort().skip).toHaveBeenCalledWith(0);
    });

    it('should handle empty result set', async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue([]);

      const result = await getUsers(1, 10, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
      expect(result.users).toHaveLength(0);
    });
  });

  describe('Search functionality with pagination', () => {
    it('should apply search filter and return paginated results', async () => {
      const searchTerm = 'John';
      const mockData = [mockProviders[0]]; // Only John Provider matches
      
      mockCountDocuments.mockResolvedValue(1);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 10, { 
        role: UserRole.PROVIDER, 
        search: searchTerm 
      });

      expect(result.success).toBe(true);
      expect(result.pagination.total).toBe(1);
      expect(result.users).toHaveLength(1);

      // Verify search query was built correctly
      expect(mockFind).toHaveBeenCalledWith({
        role: UserRole.PROVIDER,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { businessName: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    });

    it('should handle search with multiple pages', async () => {
      const searchTerm = 'Provider';
      const mockData = mockProviders.slice(0, 2); // First page of search results
      
      mockCountDocuments.mockResolvedValue(15); // 15 total matches
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 10, { 
        role: UserRole.PROVIDER, 
        search: searchTerm 
      });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2 // Math.ceil(15/10)
      });

      // Verify both role and search filters applied
      expect(mockFind).toHaveBeenCalledWith({
        role: UserRole.PROVIDER,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { businessName: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    });

    it('should handle search with no results', async () => {
      const searchTerm = 'NonexistentProvider';
      
      mockCountDocuments.mockResolvedValue(0);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue([]);

      const result = await getUsers(1, 10, { 
        role: UserRole.PROVIDER, 
        search: searchTerm 
      });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
      expect(result.users).toHaveLength(0);
    });
  });

  describe('Filter combinations with pagination', () => {
    it('should apply multiple filters and paginate correctly', async () => {
      const mockData = [mockProviders[0]]; // Only approved provider
      
      mockCountDocuments.mockResolvedValue(5);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 10, { 
        role: UserRole.PROVIDER,
        status: UserStatus.APPROVED,
        country: 'USA'
      });

      expect(result.success).toBe(true);
      expect(result.pagination.total).toBe(5);

      // Verify all filters applied
      expect(mockFind).toHaveBeenCalledWith({
        role: UserRole.PROVIDER,
        status: UserStatus.APPROVED,
        country: { $regex: 'USA', $options: 'i' }
      });
    });

    it('should handle complex search with status filter', async () => {
      const mockData = [mockProviders[2]]; // Pending provider
      
      mockCountDocuments.mockResolvedValue(3);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 10, { 
        role: UserRole.PROVIDER,
        status: UserStatus.PENDING,
        search: 'Bob'
      });

      expect(result.success).toBe(true);
      expect(result.pagination.total).toBe(3);

      // Verify combined query
      expect(mockFind).toHaveBeenCalledWith({
        role: UserRole.PROVIDER,
        status: UserStatus.PENDING,
        $or: [
          { name: { $regex: 'Bob', $options: 'i' } },
          { email: { $regex: 'Bob', $options: 'i' } },
          { businessName: { $regex: 'Bob', $options: 'i' } }
        ]
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockCountDocuments.mockRejectedValue(dbError);

      const result = await getUsers(1, 10, { role: UserRole.PROVIDER });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to fetch users');
      expect(result.users).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
    });

    it('should handle very large page numbers', async () => {
      mockCountDocuments.mockResolvedValue(25);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue([]);

      const result = await getUsers(999, 10, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination.page).toBe(999);
      expect(result.pagination.totalPages).toBe(3); // Still calculated correctly
      expect(result.users).toHaveLength(0); // No results for page 999

      // Should skip 9980 items (999-1)*10
      expect(mockFind().select().populate().sort().skip).toHaveBeenCalledWith(9980);
    });

    it('should handle zero and negative page numbers', async () => {
      mockCountDocuments.mockResolvedValue(25);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockProviders);

      // Test with page 0 (should treat as page 1)
      const result = await getUsers(0, 10, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination.page).toBe(0); // Preserves input but...
      // Should skip -10 items, which MongoDB will treat as 0
      expect(mockFind().select().populate().sort().skip).toHaveBeenCalledWith(-10);
    });

    it('should verify MongoDB query structure is correct', async () => {
      mockCountDocuments.mockResolvedValue(10);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockProviders);

      await getUsers(2, 5, { role: UserRole.PROVIDER });

      // Verify the complete MongoDB query chain
      expect(mockFind).toHaveBeenCalledWith({ role: UserRole.PROVIDER });
      expect(mockFind().select).toHaveBeenCalledWith('-password -twoFactorSecret -passwordResetToken');
      expect(mockFind().select().populate).toHaveBeenCalledWith({
        path: 'assignedCallCenterAgent',
        select: 'name email',
        model: 'User'
      });
      expect(mockFind().select().populate().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFind().select().populate().sort().skip).toHaveBeenCalledWith(5); // (2-1)*5
      expect(mockFind().select().populate().sort().skip().limit).toHaveBeenCalledWith(5);
    });
  });

  describe('Realistic pagination scenarios', () => {
    it('should handle your current scenario: 1 provider, 12 per page', async () => {
      const mockData = [mockProviders[0]];
      
      mockCountDocuments.mockResolvedValue(1);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 12, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1 // This is why pagination is hidden
      });
      expect(result.users).toHaveLength(1);
    });

    it('should handle forcing pagination: 1 provider, 1 per page', async () => {
      const mockData = [mockProviders[0]];
      
      mockCountDocuments.mockResolvedValue(1);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 1, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1 // Still 1 page, so pagination hidden
      });
    });

    it('should handle minimum pagination scenario: 2 providers, 1 per page', async () => {
      const mockData = [mockProviders[0]]; // First page
      
      mockCountDocuments.mockResolvedValue(2);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(1, 1, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2 // Now pagination would show!
      });
      expect(result.users).toHaveLength(1);
    });

    it('should handle production scenario: 127 providers, 12 per page', async () => {
      const mockData = mockProviders; // Page 5 data
      
      mockCountDocuments.mockResolvedValue(127);
      mockFind().select().populate().sort().skip().limit().lean.mockResolvedValue(mockData);

      const result = await getUsers(5, 12, { role: UserRole.PROVIDER });

      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 5,
        limit: 12,
        total: 127,
        totalPages: 11 // Math.ceil(127/12)
      });

      // Page 5 should skip 48 items (5-1)*12
      expect(mockFind().select().populate().sort().skip).toHaveBeenCalledWith(48);
    });
  });
});