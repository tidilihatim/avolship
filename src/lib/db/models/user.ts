import mongoose, { Document, Schema } from 'mongoose';
import { compare, hash } from 'bcryptjs';
import crypto from 'crypto';

/**
 * User roles
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
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Authentication methods
  comparePassword: (password: string) => Promise<boolean>;
  generatePasswordResetToken: () => { token: string; hashedToken: string; expires: Date };
  generateTwoFactorSecret: () => Promise<{ secret: string; qrCodeUrl: string; manualEntryKey: string }>;
  verifyTwoFactorToken: (token: string) => Promise<boolean>;
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
 * @returns An object containing the secret and QR code URL
 */
UserSchema.methods.generateTwoFactorSecret = async function (): Promise<{ 
  secret: string; 
  qrCodeUrl: string;
  manualEntryKey: string;
}> {
  // Dynamically import speakeasy and qrcode
  const speakeasy = await import('speakeasy');
  const QRCode = await import('qrcode');
  
  // Generate a secret
  const secret = speakeasy.generateSecret({
    name: `Avolship (${this.email})`,
    issuer: 'Avolship',
    length: 32
  });
  
  // Store the base32 secret in the user document
  this.twoFactorSecret = secret.base32;
  
  // Generate QR code data URL
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: `Avolship:${this.email}`,
    issuer: 'Avolship',
    encoding: 'base32'
  });
  
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
  
  return {
    secret: secret.base32,
    qrCodeUrl,
    manualEntryKey: secret.base32 // For manual entry if QR code fails
  };
};

/**
 * Verify a two-factor authentication token
 * @param token - The token provided by the user
 * @returns Whether the token is valid
 */
UserSchema.methods.verifyTwoFactorToken = async function (token: string): Promise<boolean> {
  if (!this.twoFactorEnabled || !this.twoFactorSecret) {
    return false;
  }
  
  // Dynamically import speakeasy to avoid server-side issues
  const speakeasy = await import('speakeasy');
  
  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps in either direction (±30 seconds)
  });
  
  return verified;
};

// Add indexes for performance
// Email index is already created by unique: true in the schema definition
UserSchema.index({ role: 1, status: 1 }); // For user listing by role
UserSchema.index({ passwordResetToken: 1, passwordResetExpires: 1 }); // For password reset
UserSchema.index({ twoFactorEnabled: 1 }); // For 2FA queries
UserSchema.index({ businessName: 'text', name: 'text' }); // Text search

// Create the model only if it doesn't already exist
const User = mongoose.models?.User || mongoose.model<IUser>('User', UserSchema);

export default User;