import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Verification Code interface for email verification
 */
export interface IVerificationCode extends Document {
  email: string;
  code: string;
  action: string; // e.g., "login", "reset_password", "change_email"
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isExpired(): boolean;
  hasMaxAttemptsReached(): boolean;
  incrementAttempts(): Promise<void>;
  markAsVerified(): Promise<void>;
}

/**
 * Static methods interface
 */
export interface IVerificationCodeModel extends Model<IVerificationCode> {
  cleanup(): Promise<void>;
  findValidCode(email: string, action: string, code: string): Promise<IVerificationCode | null>;
  invalidatePrevious(email: string, action: string): Promise<void>;
}

/**
 * Mongoose schema for VerificationCode model
 */
const VerificationCodeSchema = new Schema<IVerificationCode, IVerificationCodeModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    code: {
      type: String,
      required: [true, 'Verification code is required'],
      length: 6,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ['login', 'reset_password', 'change_email', 'register', 'enable_2fa', 'disable_2fa'],
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
VerificationCodeSchema.index({ email: 1, action: 1, verified: 1 });

// TTL index for auto-deletion of expired documents
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Method to check if code is expired
 */
VerificationCodeSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

/**
 * Method to check if max attempts reached
 */
VerificationCodeSchema.methods.hasMaxAttemptsReached = function(): boolean {
  return this.attempts >= this.maxAttempts;
};

/**
 * Method to increment attempts
 */
VerificationCodeSchema.methods.incrementAttempts = async function(): Promise<void> {
  this.attempts += 1;
  await this.save();
};

/**
 * Method to mark as verified
 */
VerificationCodeSchema.methods.markAsVerified = async function(): Promise<void> {
  this.verified = true;
  await this.save();
};

/**
 * Static method to cleanup verified codes and codes with max attempts
 * (expired codes are automatically deleted by TTL index)
 */
VerificationCodeSchema.statics.cleanup = async function(): Promise<void> {
  await this.deleteMany({
    $or: [
      { verified: true },
      { attempts: { $gte: 3 } }
    ]
  });
};

/**
 * Static method to find valid verification code
 */
VerificationCodeSchema.statics.findValidCode = async function(
  email: string,
  action: string,
  code: string
): Promise<IVerificationCode | null> {
  return await this.findOne({
    email: email.toLowerCase(),
    action,
    code,
    verified: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 }
  });
};

/**
 * Static method to invalidate previous codes for same email and action
 */
VerificationCodeSchema.statics.invalidatePrevious = async function(
  email: string,
  action: string
): Promise<void> {
  await this.updateMany(
    {
      email: email.toLowerCase(),
      action,
      verified: false
    },
    {
      verified: true // Mark as verified to invalidate
    }
  );
};

// Create the model
const VerificationCode = (mongoose.models?.VerificationCode ||
  mongoose.model<IVerificationCode, IVerificationCodeModel>('VerificationCode', VerificationCodeSchema)) as IVerificationCodeModel;

export default VerificationCode;