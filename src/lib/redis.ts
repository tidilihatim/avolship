import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
};

// Create Redis client with error handling
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!redis) {
    try {
      redis = new Redis(redisConfig);
      
      redis.on('connect', () => {
        console.log('Redis client connected');
      });
      
      redis.on('error', (err) => {
        console.error('Redis client error:', err);
        // Don't throw - allow app to work without cache
      });
      
      redis.on('close', () => {
        console.log('Redis connection closed');
      });
      
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      return null;
    }
  }
  
  return redis;
}

// Cache key generators
export const cacheKeys = {
  // User-related keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userSession: (id: string) => `session:${id}`,
  
  // Product-related keys
  product: (id: string) => `product:${id}`,
  productsBySeller: (sellerId: string) => `products:seller:${sellerId}`,
  productsByWarehouse: (warehouseId: string) => `products:warehouse:${warehouseId}`,
  
  // Order-related keys
  order: (id: string) => `order:${id}`,
  ordersBySeller: (sellerId: string, page: number = 1) => `orders:seller:${sellerId}:page:${page}`,
  ordersByAgent: (agentId: string) => `orders:agent:${agentId}`,
  orderQueue: () => 'orders:queue:call-center',
  
  // Warehouse-related keys
  warehouse: (id: string) => `warehouse:${id}`,
  warehousesBySeller: (sellerId: string) => `warehouses:seller:${sellerId}`,
  
  // Notification keys
  notificationsByUser: (userId: string) => `notifications:user:${userId}`,
  unreadCount: (userId: string) => `notifications:unread:${userId}`,
  
  // Stats and analytics
  sellerStats: (sellerId: string, date: string) => `stats:seller:${sellerId}:${date}`,
  warehouseStats: (warehouseId: string, date: string) => `stats:warehouse:${warehouseId}:${date}`,
  
  // Rate limiting keys (if not using separate rate limit store)
  rateLimit: (identifier: string, endpoint: string) => `rate:${endpoint}:${identifier}`,
};

// Cache utilities
export class CacheService {
  private redis: Redis | null;
  
  constructor() {
    this.redis = getRedisClient();
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }
  
  async del(key: string | string[]): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete error:`, error);
      return false;
    }
  }
  
  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache invalidate pattern error:`, error);
      return false;
    }
  }
  
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }
  
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }
  
  // Increment counter (useful for stats)
  async incr(key: string, by: number = 1): Promise<number | null> {
    if (!this.redis) return null;
    
    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return null;
    }
  }
  
  // Get or set with factory function
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttlSeconds?: number
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Generate new value
    try {
      const value = await factory();
      await this.set(key, value, ttlSeconds);
      return value;
    } catch (error) {
      console.error(`Cache getOrSet factory error for key ${key}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const cache = new CacheService();

// Cache decorators for methods
export function Cacheable(keyGenerator: (...args: any[]) => string, ttlSeconds?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await cache.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Call original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cache.set(key, result, ttlSeconds);
      
      return result;
    };
    
    return descriptor;
  };
}

// Cache invalidation decorator
export function InvalidateCache(keyPatternGenerator: (...args: any[]) => string | string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Call original method first
      const result = await originalMethod.apply(this, args);
      
      // Invalidate cache
      const patterns = keyPatternGenerator(...args);
      const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
      
      for (const pattern of patternsArray) {
        await cache.invalidatePattern(pattern);
      }
      
      return result;
    };
    
    return descriptor;
  };
}