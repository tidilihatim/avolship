// Database model for duplicate detection settings
import mongoose, { Document, Schema } from 'mongoose';
import { FieldType, LogicalOperator, TimeUnit } from '@/types/duplicate-detection';

interface IDuplicateCondition {
  field: FieldType;
  enabled: boolean;
}


interface IDuplicateDetectionRule {
  name: string;
  conditions: IDuplicateCondition[];
  logicalOperator: LogicalOperator;
  timeWindow: {
    value: number;
    unit: TimeUnit;
  };
  isActive: boolean;
}

export interface IDuplicateDetectionSettings extends Document {
  sellerId: mongoose.Types.ObjectId;
  rules: IDuplicateDetectionRule[];
  defaultTimeWindow: {
    value: number;
    unit: TimeUnit;
  };
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DuplicateConditionSchema = new Schema({
  field: {
    type: String,
    enum: Object.values(FieldType),
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const DuplicateDetectionRuleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  conditions: [DuplicateConditionSchema],
  logicalOperator: {
    type: String,
    enum: Object.values(LogicalOperator),
    default: LogicalOperator.AND
  },
  timeWindow: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: Object.values(TimeUnit),
      default: TimeUnit.HOURS
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const DuplicateDetectionSettingsSchema = new Schema<IDuplicateDetectionSettings>({
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  rules: [DuplicateDetectionRuleSchema],
  defaultTimeWindow: {
    value: {
      type: Number,
      default: 24
    },
    unit: {
      type: String,
      enum: Object.values(TimeUnit),
      default: TimeUnit.HOURS
    }
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create default rule for new sellers
DuplicateDetectionSettingsSchema.statics.createDefaultSettings = function (sellerId: mongoose.Types.ObjectId) {
  return new this({
    sellerId,
    isEnabled: true,
    defaultTimeWindow: {
      value: 24,
      unit: TimeUnit.HOURS
    },
    rules: [
      {
        name: 'Default Duplicate Detection',
        conditions: [
          { field: FieldType.CUSTOMER_NAME, enabled: true },
          { field: FieldType.CUSTOMER_PHONE, enabled: true },
          { field: FieldType.PRODUCT_ID, enabled: true }
        ],
        logicalOperator: LogicalOperator.AND,
        timeWindow: {
          value: 24,
          unit: TimeUnit.HOURS
        },
        isActive: true
      }
    ]
  });
};

const DuplicateDetectionSettings = mongoose.models?.DuplicateDetectionSettings ||
  mongoose.model<IDuplicateDetectionSettings>('DuplicateDetectionSettings', DuplicateDetectionSettingsSchema);

export default DuplicateDetectionSettings;