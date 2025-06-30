/**
 * Create specific test data for individual tests
 * Use this for test-specific data that doesn't belong in seedTestData
 */
export const createTestData = {
  async user(data: Partial<any> = {}) {
    const User = (await import('@/lib/db/models/user')).default;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return User.create({
      name: 'Test User',
      email: `test${timestamp}${random}@example.com`, // Unique email
      password: 'test123456', // Required field
      role: 'seller',
      status: 'approved',
      ...data
    });
  },
};