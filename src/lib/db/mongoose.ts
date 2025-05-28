import mongoose from 'mongoose';

/**
 * Global variable to track MongoDB connection status
 */
declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

// Initialize global mongoose variable
if (!global.mongoose) {
  global.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * URI for the MongoDB connection
 * Should be defined in environment variables
 */
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Connect to MongoDB
 * Uses cached connection if available to avoid multiple connections
 * @returns Promise with mongoose connection
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  // If we have a connection, return it
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  // If a connection is being established, wait for it and return it
  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: true,
    };

    // Create a new connection - storing the connection directly
    global.mongoose.promise = mongoose.connect(MONGODB_URI, opts)
      .then(mongoose => mongoose.connection);
  }

  try {
    global.mongoose.conn = await global.mongoose.promise;
  } catch (e) {
    global.mongoose.promise = null;
    throw e;
  }

  return global.mongoose.conn;
}

/**
 * Disconnect from MongoDB
 * Useful for testing environments
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (global.mongoose.conn) {
    await mongoose.disconnect();
    global.mongoose.conn = null;
    global.mongoose.promise = null;
  }
}