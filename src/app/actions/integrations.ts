"use server"

import { connectToDatabase } from '@/lib/db/mongoose';
import IntegrationPlatform, { IIntegrationPlatform } from '@/lib/db/models/integration-platform';
import UserIntegration, { IUserIntegration, IntegrationMethod, IntegrationStatus } from '@/lib/db/models/user-integration';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

// Create default platforms if none exist
async function createDefaultPlatforms() {
  const defaultPlatforms = [
    {
      platformId: 'youcan',
      name: 'YouCan',
      description: 'Morocco\'s leading e-commerce platform',
      iconPath: '/icons/youcan.svg',
      isActive: true,
      directIntegrationEnabled: true,
      googleSheetsEnabled: true,
      isRecommended: false,
      sortOrder: 1,
      settings: {
        oauthClientId: process.env.YOUCAN_CLIENT_ID || '',
        oauthClientSecret: process.env.YOUCAN_CLIENT_SECRET || '',
        webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/youcan`,
        apiEndpoint: 'https://api.youcan.shop',
        supportedFeatures: [
          'Real-time orders',
          'Auto fulfillment', 
          'Inventory sync'
        ]
      }
    },
    {
      platformId: 'shopify',
      name: 'Shopify',
      description: 'Global e-commerce platform',
      iconPath: '/icons/shopify.svg',
      isActive: false, // Coming soon
      directIntegrationEnabled: true,
      googleSheetsEnabled: true,
      isRecommended: false,
      sortOrder: 2,
      settings: {
        apiEndpoint: 'https://admin.shopify.com',
        supportedFeatures: [
          'Order management',
          'Product sync', 
          'Customer data'
        ]
      }
    },
    {
      platformId: 'woocommerce',
      name: 'WooCommerce',
      description: 'WordPress e-commerce solution',
      iconPath: '/icons/woocommerce.svg',
      isActive: false, // Coming soon
      directIntegrationEnabled: true,
      googleSheetsEnabled: true,
      isRecommended: false,
      sortOrder: 3,
      settings: {
        supportedFeatures: [
          'WordPress integration',
          'Custom workflows', 
          'Flexible setup'
        ]
      }
    }
  ];

  for (const platformData of defaultPlatforms) {
    const existingPlatform = await IntegrationPlatform.findOne({
      platformId: platformData.platformId
    });
    
    if (!existingPlatform) {
      await IntegrationPlatform.create(platformData);
    }
  }
}

// Get available platforms for frontend (filtered by admin settings)
export async function getIntegrationPlatforms() {
  try {
    await connectToDatabase();
    
    // Check if any platforms exist, if not create defaults
    const platformCount = await IntegrationPlatform.countDocuments();
    if (platformCount === 0) {
      await createDefaultPlatforms();
    }
    
    const platforms = await IntegrationPlatform.find({ 
      isActive: true 
    }).sort({ sortOrder: 1, name: 1 });
    
    return {
      success: true,
      data: platforms.map(platform => ({
        id: platform.platformId,
        name: platform.name,
        description: platform.description,
        iconPath: platform.iconPath,
        isRecommended: platform.isRecommended,
        directIntegrationEnabled: platform.directIntegrationEnabled,
        googleSheetsEnabled: platform.googleSheetsEnabled,
        features: platform.settings.supportedFeatures || [],
        status: platform.isActive ? 'available' : 'coming-soon'
      }))
    };
  } catch (error) {
    console.error('Error fetching available platforms:', error);
    return {
      success: false,
      error: 'Failed to fetch platforms'
    };
  }
}

// Get platform integration methods for a specific platform
export async function getPlatformIntegrationMethods(platformId: string) {
  try {
    await connectToDatabase();
    
    const platform = await IntegrationPlatform.findOne({ 
      platformId, 
      isActive: true 
    });
    
    if (!platform) {
      return {
        success: false,
        error: 'Platform not found or not available'
      };
    }
    
    const methods = [];
    
    if (platform.directIntegrationEnabled) {
      methods.push({
        id: 'direct',
        name: 'Direct Integration',
        description: `Automatic order sync via ${platform.name} API`,
        isRecommended: true,
        setupTime: 'Auto',
        features: [
          'Real-time order sync',
          'Automatic fulfillment',
          'No manual work required',
          'Secure OAuth connection'
        ]
      });
    }
    
    if (platform.googleSheetsEnabled) {
      methods.push({
        id: 'sheets',
        name: 'Google Sheets',
        description: 'Manual order entry with automated sync',
        isRecommended: false,
        setupTime: '5 min',
        features: [
          'Manual order entry',
          'Google Sheets integration',
          'Custom script provided',
          'Flexible data format'
        ]
      });
    }
    
    return {
      success: true,
      data: {
        platform: {
          id: platform.platformId,
          name: platform.name
        },
        methods
      }
    };
  } catch (error) {
    console.error('Error fetching platform integration methods:', error);
    return {
      success: false,
      error: 'Failed to fetch integration methods'
    };
  }
}

// Get user's integrations for a specific warehouse
export async function getUserIntegrations(userId: string, warehouseId: string) {
  try {
    await connectToDatabase();
    
    const integrations = await UserIntegration.find({
      userId,
      warehouseId,
      $or: [
        { isActive: true },
        { status: 'paused' }
      ]
    }).sort({ createdAt: -1 }).lean();
    
    // Convert to plain objects using JSON serialization
    return JSON.parse(JSON.stringify(integrations));
  } catch (error) {
    console.error('Error fetching user integrations:', error);
    return [];
  }
}

// Create user integration
export async function createUserIntegration(
  platformId: string, 
  integrationMethod: IntegrationMethod,
  connectionData: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }
    
    await connectToDatabase();
    
    // Check if platform is available
    const platform = await IntegrationPlatform.findOne({ 
      platformId, 
      isActive: true 
    });
    
    if (!platform) {
      return {
        success: false,
        error: 'Platform not available'
      };
    }
    
    // Check if method is enabled
    if (integrationMethod === IntegrationMethod.DIRECT && !platform.directIntegrationEnabled) {
      return {
        success: false,
        error: 'Direct integration not available for this platform'
      };
    }
    
    if (integrationMethod === IntegrationMethod.GOOGLE_SHEETS && !platform.googleSheetsEnabled) {
      return {
        success: false,
        error: 'Google Sheets integration not available for this platform'
      };
    }
    
    // Check if user already has this integration
    const existingIntegration = await UserIntegration.findOne({
      userId: session.user.id,
      platformId,
      integrationMethod,
      isActive: true
    });
    
    if (existingIntegration) {
      return {
        success: false,
        error: 'Integration already exists'
      };
    }
    
    // Create new integration
    const integration = new UserIntegration({
      userId: session.user.id,
      platformId,
      integrationMethod,
      status: IntegrationStatus.CONNECTED,
      connectionData,
      syncStats: {
        totalOrdersSynced: 0,
        syncErrors: 0
      }
    });
    
    await integration.save();
    
    return {
      success: true,
      data: integration
    };
  } catch (error) {
    console.error('Error creating user integration:', error);
    return {
      success: false,
      error: 'Failed to create integration'
    };
  }
}

// Admin functions
export async function getAllPlatforms() {
  try {
    await connectToDatabase();
    
    const platforms = await IntegrationPlatform.find({})
      .sort({ sortOrder: 1, name: 1 });
    
    return {
      success: true,
      data: platforms
    };
  } catch (error) {
    console.error('Error fetching all platforms:', error);
    return {
      success: false,
      error: 'Failed to fetch platforms'
    };
  }
}

export async function updatePlatformSettings(
  platformId: string, 
  updates: Partial<IIntegrationPlatform>
) {
  try {
    await connectToDatabase();
    
    const platform = await IntegrationPlatform.findOneAndUpdate(
      { platformId },
      updates,
      { new: true }
    );
    
    if (!platform) {
      return {
        success: false,
        error: 'Platform not found'
      };
    }
    
    return {
      success: true,
      data: platform
    };
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return {
      success: false,
      error: 'Failed to update platform settings'
    };
  }
}

// Pause user integration
export async function pauseIntegration(integrationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }
    
    await connectToDatabase();
    
    const integration = await UserIntegration.findOne({
      _id: integrationId,
      userId: session.user.id,
      isActive: true
    });
    
    if (!integration) {
      return {
        success: false,
        error: 'Integration not found'
      };
    }
    
    if (integration.status !== IntegrationStatus.CONNECTED) {
      return {
        success: false,
        error: 'Integration must be connected to pause'
      };
    }
    
    // Update integration status to paused and set isActive to false
    integration.status = IntegrationStatus.PAUSED;
    integration.isActive = false;
    await integration.save();
    
    return {
      success: true,
      message: 'Integration paused successfully'
    };
  } catch (error) {
    console.error('Error pausing integration:', error);
    return {
      success: false,
      error: 'Failed to pause integration'
    };
  }
}

// Resume user integration
export async function resumeIntegration(integrationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }
    
    await connectToDatabase();
    
    const integration = await UserIntegration.findOne({
      _id: integrationId,
      userId: session.user.id
    });
    
    if (!integration) {
      return {
        success: false,
        error: 'Integration not found'
      };
    }
    
    if (integration.status !== IntegrationStatus.PAUSED) {
      return {
        success: false,
        error: 'Integration must be paused to resume'
      };
    }
    
    // Update integration status to connected and set isActive to true
    integration.status = IntegrationStatus.CONNECTED;
    integration.isActive = true;
    await integration.save();
    
    return {
      success: true,
      message: 'Integration resumed successfully'
    };
  } catch (error) {
    console.error('Error resuming integration:', error);
    return {
      success: false,
      error: 'Failed to resume integration'
    };
  }
}

// Disconnect user integration
export async function disconnectIntegration(integrationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }
    
    await connectToDatabase();
    
    const integration = await UserIntegration.findOne({
      _id: integrationId,
      userId: session.user.id,
      isActive: true
    });
    
    if (!integration) {
      return {
        success: false,
        error: 'Integration not found'
      };
    }
    
    // If it's a YouCan integration, delete webhooks
    if (integration.platformId === 'youcan' && integration.connectionData?.webhookSubscriptions) {
      const accessToken = integration.connectionData.accessToken;
      
      if (accessToken) {
        for (const subscription of integration.connectionData.webhookSubscriptions) {
          try {
            await fetch(`https://api.youcan.shop/resthooks/unsubscribe/${subscription.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              }
            });
            console.log(`Deleted webhook subscription: ${subscription.id}`);
          } catch (error) {
            console.error(`Failed to delete webhook ${subscription.id}:`, error);
          }
        }
      }
    }
    
    // Delete the integration document completely
    await UserIntegration.findByIdAndDelete(integrationId);
    
    return {
      success: true,
      message: 'Integration disconnected and removed successfully'
    };
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return {
      success: false,
      error: 'Failed to disconnect integration'
    };
  }
}