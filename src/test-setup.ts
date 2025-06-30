import '@testing-library/jest-dom'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'

// Global mocks for all tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock the mongoose connection function since we use MongoDB Memory Server
vi.mock('@/lib/db/mongoose', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined)
}))

// Mock environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000'
})

// Set up MongoDB Memory Server for ALL tests (both unit and integration)
let mongoServer: MongoMemoryServer

console.log('🔧 Setting up MongoDB Memory Server for all tests')

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  
  // Connect to the in-memory database
  await mongoose.connect(uri)
  console.log('🧪 Test database connected')
})

afterAll(async () => {
  // Cleanup: disconnect and stop the server
  await mongoose.disconnect()
  await mongoServer.stop()
  console.log('🧪 Test database disconnected')
})

beforeEach(async () => {
  // Clear all collections before each test for isolation
  const collections = mongoose.connection.collections
  
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})