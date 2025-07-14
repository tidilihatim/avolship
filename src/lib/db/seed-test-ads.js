// Simple MongoDB script to seed test featured ads
const mongoose = require('mongoose');

// MongoDB connection - using direct URL since we're in development
const MONGODB_URI = 'mongodb://localhost:27017/avolship';

// Define schemas
const providerSchema = new mongoose.Schema({
  businessName: String,
  businessInfo: String,
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  serviceType: String,
  serviceDescription: String,
  coverageAreas: [String],
  website: String,
  profileImage: String,
  country: String,
  city: String,
  address: String,
  zipCode: String,
  status: String
});

const featuredAdSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  title: String,
  description: String,
  bannerImageUrl: String,
  ctaText: String,
  ctaLink: String,
  placement: String,
  targetCountries: [String],
  targetServiceTypes: [String],
  budget: Number,
  maxCPC: Number,
  startDate: Date,
  endDate: Date,
  status: String,
  impressions: Number,
  clicks: Number
});

const Provider = mongoose.model('Provider', providerSchema);
const FeaturedProviderAd = mongoose.model('FeaturedProviderAd', featuredAdSchema);

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test provider
    let provider = await Provider.findOne({ businessName: 'Express Logistics Co.' });
    
    if (!provider) {
      provider = await Provider.create({
        businessName: 'Express Logistics Co.',
        businessInfo: 'Premium express shipping services across Africa',
        contactName: 'John Doe',
        contactEmail: 'contact@expresslogistics.test',
        contactPhone: '+254700000000',
        serviceType: 'EXPRESS_SHIPPING',
        serviceDescription: 'Fast and reliable shipping solutions',
        coverageAreas: ['Kenya', 'Tanzania', 'Uganda'],
        website: 'https://expresslogistics.test',
        profileImage: 'https://ui-avatars.com/api/?name=Express+Logistics&background=0D9488&color=fff',
        country: 'Kenya',
        city: 'Nairobi',
        address: '123 Logistics Avenue',
        zipCode: '00100',
        status: 'APPROVED'
      });
      console.log('Created test provider');
    }

    // Clear existing test ads
    await FeaturedProviderAd.deleteMany({ 
      provider: provider._id,
      placement: 'DASHBOARD_BANNER' 
    });

    // Create test featured ads
    const ads = [
      {
        provider: provider._id,
        title: 'Express Shipping - 50% Off First Month',
        description: 'Get premium express shipping services at half the price for your first month!',
        bannerImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop',
        ctaText: 'Get Started',
        ctaLink: `/dashboard/seller/providers/${provider._id}`,
        placement: 'DASHBOARD_BANNER',
        targetCountries: ['Kenya', 'Tanzania', 'Uganda'],
        targetServiceTypes: ['EXPRESS_SHIPPING'],
        budget: 1000,
        maxCPC: 2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        impressions: 0,
        clicks: 0
      },
      {
        provider: provider._id,
        title: 'Reliable Logistics Partner',
        description: 'Your trusted partner for all shipping needs across East Africa',
        bannerImageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&h=400&fit=crop',
        ctaText: 'Learn More',
        ctaLink: `/dashboard/seller/providers/${provider._id}`,
        placement: 'DASHBOARD_BANNER',
        targetCountries: ['Kenya'],
        budget: 500,
        maxCPC: 1.5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        impressions: 0,
        clicks: 0
      },
      {
        provider: provider._id,
        title: 'Same Day Delivery Available',
        description: 'Get your packages delivered the same day in major cities',
        bannerImageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200&h=400&fit=crop',
        ctaText: 'Ship Now',
        placement: 'DASHBOARD_BANNER',
        targetCountries: ['Kenya', 'Tanzania'],
        budget: 750,
        maxCPC: 1.8,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        impressions: 0,
        clicks: 0
      }
    ];

    const createdAds = await FeaturedProviderAd.insertMany(ads);
    console.log(`Created ${createdAds.length} test featured ads`);

    // Also create search result ads
    const searchAds = [
      {
        provider: provider._id,
        title: 'Featured Provider - Express Logistics',
        description: 'Premium shipping services with guaranteed delivery times',
        ctaText: 'View Details',
        placement: 'SEARCH_RESULTS',
        targetCountries: ['Kenya', 'Tanzania', 'Uganda'],
        budget: 300,
        maxCPC: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        impressions: 0,
        clicks: 0
      }
    ];

    await FeaturedProviderAd.insertMany(searchAds);
    console.log('Created search result ads');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedData();