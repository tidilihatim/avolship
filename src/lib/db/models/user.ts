import mongoose, { Document, Schema } from 'mongoose';
import { compare, hash } from 'bcryptjs';
import crypto from 'crypto';

/**
 * User roles according to SRS section 3.1
 */
export enum UserRole {
  SELLER = 'seller',
  PROVIDER = 'provider',
  DELIVERY = 'delivery',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPPORT = 'support',
  CALL_CENTER = 'call_center',
}

/**
 * User status for approval workflow
 */
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Delivery guy location interface for real-time tracking
 */
export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number; // GPS accuracy in meters
}


/**
 * User interface based on SRS requirements
 * Implements authentication features from section 2.1
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  businessName?: string;
  businessInfo?: string;
  serviceType?: string; // Added for providers
  country?: string;
  assignedCallCenterAgent?: mongoose.Types.ObjectId; // For sellers: which call center agent handles their orders
  
  // Delivery Guy specific fields
  isAvailableForDelivery?: boolean; // Whether delivery guy is accepting new orders
  currentLocation?: DeliveryLocation; // Current GPS location
  locationHistory?: DeliveryLocation[]; // Location tracking history
  maxDeliveryRadius?: number; // Maximum delivery radius in km
  
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastActive?: Date;
  
  // Profile image fields
  profileImage?: string; // S3 URL for profile image
  profileImageKey?: string; // S3 key for profile image
  
  createdAt: Date;
  updatedAt: Date;

  // Authentication methods
  comparePassword: (password: string) => Promise<boolean>;
  generatePasswordResetToken: () => { token: string; hashedToken: string; expires: Date };
  generateTwoFactorSecret: () => string;
  verifyTwoFactorToken: (token: string) => boolean;
  
  // Delivery methods
  updateLocation: (location: DeliveryLocation) => Promise<void>;
  calculateDistanceToLocation: (targetLat: number, targetLng: number) => number;
}

/**
 * Mongoose schema for User model
 * Implements requirements from section 2.1 (Authentication & Security)
 */
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, 'User role is required'],
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },
    phone: {
      type: String,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    businessInfo: {
      type: String,
    },
    serviceType: {
      type: String, // Added for providers
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    assignedCallCenterAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Only for sellers - references a call center agent
    },
    
    // Delivery Guy specific fields
    isAvailableForDelivery: {
      type: Boolean,
      default:true,
    },
    currentLocation: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      accuracy: {
        type: Number,
        min: 0,
      },
    },
    locationHistory: [{
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      accuracy: {
        type: Number,
        min: 0,
      },
    }],
    maxDeliveryRadius: {
      type: Number,
      default: 10, // 10km default radius
      min: 1,
    },
    
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    lastActive: {
      type: Date,
    },
    
    // Profile image fields
    profileImage: {
      type: String,
      trim: true,
    },
    profileImageKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

/**
 * Pre-save middleware to hash the password before saving
 */
UserSchema.pre('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash the password with a salt factor of 12
    this.password = await hash(this.password, 12);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Compare a candidate password with the user's password
 * @param candidatePassword - The plain text password to check
 * @returns Promise<boolean> - Returns true if the passwords match
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return compare(candidatePassword, this.password);
};

/**
 * Generate a password reset token and expiry
 * @returns An object with the plain token, hashed token for storage, and expiry time
 */
UserSchema.methods.generatePasswordResetToken = function (): { token: string; hashedToken: string; expires: Date } {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage in the database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Set token expiry to 1 hour from now
  const expires = new Date(Date.now() + 3600000); // 1 hour in milliseconds
  
  // Update the user document
  this.passwordResetToken = hashedToken;
  this.passwordResetExpires = expires;
  
  return { token, hashedToken, expires };
};

/**
 * Generate a secret for two-factor authentication
 * @returns A secret key for TOTP (Time-based One-Time Password)
 */
UserSchema.methods.generateTwoFactorSecret = function (): string {
  // In a real implementation, you would use a library like 'speakeasy'
  // to generate a proper secret for TOTP
  const secret = `secret_${this.email}_${crypto.randomBytes(10).toString('hex')}`;
  
  // Store the secret in the user document
  this.twoFactorSecret = secret;
  
  return secret;
};

/**
 * Verify a two-factor authentication token
 * @param token - The token provided by the user
 * @returns Whether the token is valid
 */
UserSchema.methods.verifyTwoFactorToken = function (token: string): boolean {
  // This is a placeholder - in a real implementation, you would use a library like 'speakeasy'
  // to verify the TOTP token against this.twoFactorSecret
  
  // For demonstration purposes only:
  return token === '123456'; // Obviously, this is not secure and needs real implementation
};

/**
 * Update delivery guy's current location and add to history
 * @param location - New location data
 */
UserSchema.methods.updateLocation = async function (location: DeliveryLocation): Promise<void> {
  if (this.role !== UserRole.DELIVERY) {
    throw new Error('Only delivery guys can update location');
  }
  
  // Update current location
  this.currentLocation = location;
  
  // Add to location history (keep only last 100 locations)
  if (!this.locationHistory) {
    this.locationHistory = [];
  }
  
  this.locationHistory.push(location);
  
  // Keep only last 100 location entries
  if (this.locationHistory.length > 100) {
    this.locationHistory = this.locationHistory.slice(-100);
  }
  
  this.lastActive = new Date();
  await this.save();
};

/**
 * Calculate distance between delivery guy's current location and target location
 * @param targetLat - Target latitude
 * @param targetLng - Target longitude
 * @returns Distance in kilometers
 */
UserSchema.methods.calculateDistanceToLocation = function (targetLat: number, targetLng: number): number {
  if (!this.currentLocation) {
    return Infinity;
  }
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (targetLat - this.currentLocation.latitude) * Math.PI / 180;
  const dLon = (targetLng - this.currentLocation.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.currentLocation.latitude * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};


// Create the model only if it doesn't already exist
const User = mongoose.models?.User || mongoose.model<IUser>('User', UserSchema);

export default User;