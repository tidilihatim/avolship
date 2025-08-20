import mongoose, { Document, Schema } from 'mongoose';

/**
 * Token transaction type enum
 */
export enum TokenTransactionType {
  PURCHASE = 'purchase',
  SPEND = 'spend',
  REFUND = 'refund',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

/**
 * Token transaction status enum
 */
export enum TokenTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Token transaction interface for tracking all token movements
 */
export interface ITokenTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TokenTransactionType;
  status: TokenTransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: {
    stripePaymentIntentId?: string;
    tokenPackageId?: mongoose.Types.ObjectId;
    profileBoostId?: mongoose.Types.ObjectId;
    adminUserId?: mongoose.Types.ObjectId;
    refundReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User token balance interface
 */
export interface IUserToken extends Document {
  userId: mongoose.Types.ObjectId;
  currentBalance: number;
  totalPurchased: number;
  totalSpent: number;
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addTokens: (amount: number, transactionData: Partial<ITokenTransaction>) => Promise<ITokenTransaction>;
  spendTokens: (amount: number, transactionData: Partial<ITokenTransaction>) => Promise<ITokenTransaction>;
  getTransactionHistory: (limit?: number) => Promise<ITokenTransaction[]>;
}

/**
 * Token transaction schema
 */
const TokenTransactionSchema = new Schema<ITokenTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: Object.values(TokenTransactionType),
      required: [true, 'Transaction type is required'],
    },
    status: {
      type: String,
      enum: Object.values(TokenTransactionStatus),
      default: TokenTransactionStatus.PENDING,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    balanceBefore: {
      type: Number,
      required: [true, 'Balance before is required'],
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Balance after is required'],
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    metadata: {
      stripePaymentIntentId: String,
      tokenPackageId: {
        type: Schema.Types.ObjectId,
        ref: 'TokenPackage',
      },
      profileBoostId: {
        type: Schema.Types.ObjectId,
        ref: 'ProfileBoost',
      },
      adminUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      refundReason: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * User token balance schema
 */
const UserTokenSchema = new Schema<IUserToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchased: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastTransactionAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TokenTransactionSchema.index({ userId: 1, createdAt: -1 });
TokenTransactionSchema.index({ status: 1 });
TokenTransactionSchema.index({ 'metadata.stripePaymentIntentId': 1 }, { sparse: true });

UserTokenSchema.index({ userId: 1 });

/**
 * Add tokens to user balance with transaction record
 */
UserTokenSchema.methods.addTokens = async function (
  amount: number,
  transactionData: Partial<ITokenTransaction>
): Promise<ITokenTransaction> {
  const TokenTransaction = mongoose.models?.TokenTransaction || mongoose.model('TokenTransaction', TokenTransactionSchema);
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const balanceBefore = this.currentBalance;
    const balanceAfter = balanceBefore + amount;
    
    // Create transaction record
    const transaction = new TokenTransaction({
      userId: this.userId,
      type: TokenTransactionType.PURCHASE,
      amount,
      balanceBefore,
      balanceAfter,
      ...transactionData,
    });
    
    // Update user balance
    this.currentBalance = balanceAfter;
    this.totalPurchased += amount;
    this.lastTransactionAt = new Date();
    
    await transaction.save({ session });
    await this.save({ session });
    
    await session.commitTransaction();
    return transaction;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Spend tokens from user balance with transaction record
 */
UserTokenSchema.methods.spendTokens = async function (
  amount: number,
  transactionData: Partial<ITokenTransaction>
): Promise<ITokenTransaction> {
  if (this.currentBalance < amount) {
    throw new Error('Insufficient token balance');
  }
  
  const TokenTransaction = mongoose.models?.TokenTransaction || mongoose.model('TokenTransaction', TokenTransactionSchema);
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const balanceBefore = this.currentBalance;
    const balanceAfter = balanceBefore - amount;
    
    // Create transaction record
    const transaction = new TokenTransaction({
      userId: this.userId,
      type: TokenTransactionType.SPEND,
      amount: -amount,
      balanceBefore,
      balanceAfter,
      status: TokenTransactionStatus.COMPLETED,
      ...transactionData,
    });
    
    // Update user balance
    this.currentBalance = balanceAfter;
    this.totalSpent += amount;
    this.lastTransactionAt = new Date();
    
    await transaction.save({ session });
    await this.save({ session });
    
    await session.commitTransaction();
    return transaction;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get transaction history for user
 */
UserTokenSchema.methods.getTransactionHistory = async function (
  limit: number = 20
): Promise<ITokenTransaction[]> {
  const TokenTransaction = mongoose.models?.TokenTransaction || mongoose.model('TokenTransaction', TokenTransactionSchema);
  
  return await TokenTransaction
    .find({ userId: this.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('metadata.tokenPackageId')
    .populate('metadata.profileBoostId')
    .populate('metadata.adminUserId', 'name email');
};

const TokenTransaction = mongoose.models?.TokenTransaction || mongoose.model<ITokenTransaction>('TokenTransaction', TokenTransactionSchema);
const UserToken = mongoose.models?.UserToken || mongoose.model<IUserToken>('UserToken', UserTokenSchema);

export { TokenTransaction };
export default UserToken;