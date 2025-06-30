import { describe, it, expect, vi } from 'vitest';
import { createTestData } from '../utils/test-database';
import { getUsers } from '../../app/actions/user';
import { UserRole, UserStatus } from '@/lib/db/models/user';

// Mock only external dependencies that we don't want to test
vi.mock('@/lib/validations/user', () => ({
  validateUserFilters: vi.fn(() => ({ isValid: true })),
  sanitizeUserData: vi.fn((data) => data),
  validateUserForm: vi.fn(() => ({ isValid: true }))
}));

vi.mock('@/lib/notifications/send-notification', () => ({
  sendNotification: vi.fn()
}));

describe('getUsers Integration Tests', () => {
  // Setup real database for these integration tests
  describe('Real database pagination', () => {
    it('should paginate real users correctly', async () => {
      // Create 25 real users in the database
      const users = [];
      for (let i = 0; i < 25; i++) {
        users.push(await createTestData.user({
          name: `Provider ${i}`,
          email: `provider${i}@test.com`,
          role: UserRole.PROVIDER,
          status: UserStatus.APPROVED
        }));
      }

      // Test first page
      const page1 = await getUsers(1, 10, { role: UserRole.PROVIDER });
      expect(page1.success).toBe(true);
      expect(page1.users).toHaveLength(10);
      expect(page1.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3
      });

      // Test second page
      const page2 = await getUsers(2, 10, { role: UserRole.PROVIDER });
      expect(page2.success).toBe(true);
      expect(page2.users).toHaveLength(10);
      expect(page2.pagination.page).toBe(2);

      // Test last page
      const page3 = await getUsers(3, 10, { role: UserRole.PROVIDER });
      expect(page3.success).toBe(true);
      expect(page3.users).toHaveLength(5); // Only 5 remaining on last page
      expect(page3.pagination.page).toBe(3);

      // Verify no duplicate users across pages
      const page1Ids = page1.users.map(u => u._id);
      const page2Ids = page2.users.map(u => u._id);
      const page3Ids = page3.users.map(u => u._id);
      
      const allIds = [...page1Ids, ...page2Ids, ...page3Ids];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(25); // No duplicates
    });

    it('should handle search with real database queries', async () => {
      // Create users with searchable data
      await createTestData.user({
        name: 'John Provider',
        email: 'john@logistics.com',
        businessName: 'John Logistics Co',
        role: UserRole.PROVIDER
      });
      
      await createTestData.user({
        name: 'Jane Seller',
        email: 'jane@store.com',
        businessName: 'Jane Store',
        role: UserRole.SELLER
      });

      // Search by name
      const nameSearch = await getUsers(1, 10, {
        role: UserRole.PROVIDER,
        search: 'John'
      });
      expect(nameSearch.success).toBe(true);
      expect(nameSearch.users).toHaveLength(1);
      expect(nameSearch.users[0].name).toBe('John Provider');

      // Search by email
      const emailSearch = await getUsers(1, 10, {
        search: 'logistics'
      });
      expect(emailSearch.users.some(u => u.email.includes('logistics'))).toBe(true);

      // Search by business name
      const businessSearch = await getUsers(1, 10, {
        search: 'Store'
      });
      expect(businessSearch.users.some(u => u.businessName?.includes('Store'))).toBe(true);
    });

    it('should handle real MongoDB filters and combinations', async () => {
      // Create users with different statuses and countries
      await createTestData.user({
        name: 'Approved US Provider',
        role: UserRole.PROVIDER,
        status: UserStatus.APPROVED,
        country: 'USA'
      });

      await createTestData.user({
        name: 'Pending US Provider',
        role: UserRole.PROVIDER,
        status: UserStatus.PENDING,
        country: 'USA'
      });

      await createTestData.user({
        name: 'Approved CA Provider',
        role: UserRole.PROVIDER,
        status: UserStatus.APPROVED,
        country: 'Canada'
      });

      // Filter by status
      const approved = await getUsers(1, 10, {
        role: UserRole.PROVIDER,
        status: UserStatus.APPROVED
      });
      expect(approved.users).toHaveLength(2);
      expect(approved.users.every(u => u.status === 'approved')).toBe(true);

      // Filter by country
      const usProviders = await getUsers(1, 10, {
        role: UserRole.PROVIDER,
        country: 'USA'
      });
      expect(usProviders.users).toHaveLength(2);
      expect(usProviders.users.every(u => u.country === 'USA')).toBe(true);

      // Combine filters
      const approvedUS = await getUsers(1, 10, {
        role: UserRole.PROVIDER,
        status: UserStatus.APPROVED,
        country: 'USA'
      });
      expect(approvedUS.users).toHaveLength(1);
      expect(approvedUS.users[0].name).toBe('Approved US Provider');
    });

    it('should properly exclude password fields in real queries', async () => {
      // Create user with password
      await createTestData.user({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret123',
        twoFactorSecret: 'secret456',
        passwordResetToken: 'reset789'
      });

      const result = await getUsers(1, 10, {});
      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(1);
      
      const user = result.users[0];
      expect(user.password).toBeUndefined();
      expect(user.twoFactorSecret).toBeUndefined();
      expect(user.passwordResetToken).toBeUndefined();
    });

    it('should handle edge cases with real database', async () => {
      // Test with no data
      const empty = await getUsers(1, 10, { role: UserRole.PROVIDER });
      expect(empty.users).toHaveLength(0);
      expect(empty.pagination.total).toBe(0);

      // Test with invalid page numbers
      await createTestData.user({ role: UserRole.PROVIDER });
      
      const invalidPage = await getUsers(999, 10, { role: UserRole.PROVIDER });
      expect(invalidPage.success).toBe(true);
      expect(invalidPage.users).toHaveLength(0); // No results on page 999
      expect(invalidPage.pagination.total).toBe(1); // But total is still correct
    });
  });

  describe('Performance and MongoDB-specific behavior', () => {
    it('should handle large datasets efficiently', async () => {
      // Create 20 users (reduced for test performance)
      const users = [];
      for (let i = 0; i < 20; i++) {
        users.push(await createTestData.user({
          name: `User ${i}`,
          role: UserRole.SELLER
        }));
      }

      const start = Date.now();
      const result = await getUsers(1, 50, { role: UserRole.SELLER });
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(20);
      expect(result.pagination.total).toBe(20);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should test MongoDB sorting behavior', async () => {
      // Create users with different creation times
      await createTestData.user({
        name: 'First User',
        createdAt: new Date('2024-01-01')
      });
      
      await createTestData.user({
        name: 'Second User', 
        createdAt: new Date('2024-01-02')
      });

      await createTestData.user({
        name: 'Third User',
        createdAt: new Date('2024-01-03')
      });

      const result = await getUsers(1, 10, {});
      expect(result.success).toBe(true);
      
      // Should be sorted by createdAt descending (newest first)
      expect(result.users[0].name).toBe('Third User');
      expect(result.users[1].name).toBe('Second User');
      expect(result.users[2].name).toBe('First User');
    });

    it('should test regex search case-insensitivity', async () => {
      await createTestData.user({
        name: 'UPPERCASE USER',
        email: 'UPPER@TEST.COM'
      });

      // Search with lowercase should find uppercase
      const result = await getUsers(1, 10, {
        search: 'uppercase'
      });
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('UPPERCASE USER');

      // Search email with different case
      const emailResult = await getUsers(1, 10, {
        search: 'upper@test.com'
      });
      expect(emailResult.users).toHaveLength(1);
    });
  });

  describe('Error scenarios with real database', () => {
    it('should handle invalid queries gracefully', async () => {
      // Test with invalid filter that should still work
      const result = await getUsers(1, 10, { 
        role: 'invalid_role' as any 
      });
      
      expect(result.success).toBe(true);
      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});