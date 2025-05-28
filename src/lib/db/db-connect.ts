import { connectToDatabase } from './mongoose';

/**
 * HOF (Higher Order Function) to ensure database connection before executing server actions
 * @param callback - The server action function to execute after connecting to database
 * @returns A function that ensures database connection before executing the callback
 */
export function withDbConnection<T extends any[], R>(
  callback: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    try {
      // Ensure connection to database
      await connectToDatabase();
      
      // Execute the server action
      return await callback(...args);
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  };
}