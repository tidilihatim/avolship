const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define warehouse schema inline since we can't import TypeScript
const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String },
  currency: { type: String, required: true },
  address: { type: String },
  capacity: { type: Number },
  capacityUnit: { type: String, default: 'items' },
  isAvailableToAll: { type: Boolean, default: false },
  assignedSellers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);

async function seedWarehouses() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avolship';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    // Check if warehouses already exist
    const existingCount = await Warehouse.countDocuments();
    if (existingCount > 0) {
      console.log(`Warehouses already exist (${existingCount} found). Skipping seed.`);
      return;
    }

    // Create test warehouses
    const warehouses = [
      {
        name: 'Main Warehouse Morocco',
        country: 'Morocco',
        city: 'Casablanca',
        currency: 'MAD',
        address: '123 Industrial Zone, Casablanca',
        capacity: 10000,
        capacityUnit: 'items',
        isAvailableToAll: true,
        isActive: true,
      },
      {
        name: 'Central Storage Egypt',
        country: 'Egypt',
        city: 'Cairo',
        currency: 'EGP',
        address: '456 Warehouse District, Cairo',
        capacity: 15000,
        capacityUnit: 'items',
        isAvailableToAll: true,
        isActive: true,
      },
      {
        name: 'Lagos Distribution Center',
        country: 'Nigeria',
        city: 'Lagos',
        currency: 'NGN',
        address: '789 Commerce Park, Lagos',
        capacity: 8000,
        capacityUnit: 'items',
        isAvailableToAll: true,
        isActive: true,
      },
      {
        name: 'Kenya Fulfillment Hub',
        country: 'Kenya',
        city: 'Nairobi',
        currency: 'KES',
        address: '321 Enterprise Road, Nairobi',
        capacity: 12000,
        capacityUnit: 'items',
        isAvailableToAll: true,
        isActive: true,
      },
      {
        name: 'South Africa Depot',
        country: 'South Africa',
        city: 'Johannesburg',
        currency: 'ZAR',
        address: '654 Logistics Avenue, Johannesburg',
        capacity: 20000,
        capacityUnit: 'items',
        isAvailableToAll: true,
        isActive: true,
      },
    ];

    // Insert warehouses
    const result = await Warehouse.insertMany(warehouses);
    console.log(`✅ Successfully seeded ${result.length} warehouses`);

    // Display created warehouses
    console.log('\nCreated warehouses:');
    result.forEach(warehouse => {
      console.log(`- ${warehouse.name} (${warehouse.city}, ${warehouse.country})`);
    });

  } catch (error) {
    console.error('❌ Error seeding warehouses:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the seed function
seedWarehouses();