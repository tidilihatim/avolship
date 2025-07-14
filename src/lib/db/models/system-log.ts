import mongoose, { Document, Schema } from 'mongoose';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export enum LogCategory {
  API_ERROR = 'api_error',
  AUTH_ERROR = 'auth_error',
  DATABASE_ERROR = 'database_error',
  VALIDATION_ERROR = 'validation_error',
  PAYMENT_ERROR = 'payment_error',
  CRITICAL_OPERATION = 'critical_operation',
  SECURITY_EVENT = 'security_event',
  PERFORMANCE_ISSUE = 'performance_issue',
  USER_ACTION = 'user_action',
  SYSTEM_ERROR = 'system_error',
}

export interface ISystemLog extends Document {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: mongoose.Types.ObjectId;
  userRole?: string;
  userEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
  fingerprint?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
}

const SystemLogSchema = new Schema<ISystemLog>(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    level: {
      type: String,
      enum: Object.values(LogLevel),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(LogCategory),
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userRole: {
      type: String,
      index: true,
    },
    userEmail: {
      type: String,
    },
    action: {
      type: String,
      index: true,
    },
    resourceType: {
      type: String,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    url: {
      type: String,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    },
    statusCode: {
      type: Number,
    },
    duration: {
      type: Number, // in milliseconds
    },
    error: {
      name: String,
      message: String,
      stack: String,
      code: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    fingerprint: {
      type: String,
      index: true,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  }
);

// Compound indexes for common queries
SystemLogSchema.index({ level: 1, timestamp: -1 });
SystemLogSchema.index({ category: 1, timestamp: -1 });
SystemLogSchema.index({ userId: 1, timestamp: -1 });
SystemLogSchema.index({ fingerprint: 1, timestamp: -1 });
SystemLogSchema.index({ resolved: 1, level: 1, timestamp: -1 });

// Text index for searching
SystemLogSchema.index({ message: 'text', 'error.message': 'text' });

// TTL index to automatically delete old logs (90 days by default)
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static methods for common queries
SystemLogSchema.statics.getRecentErrors = function(limit = 100) {
  return this.find({ level: LogLevel.ERROR })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

SystemLogSchema.statics.getUnresolvedErrors = function() {
  return this.find({ 
    level: LogLevel.ERROR, 
    resolved: false 
  })
    .sort({ timestamp: -1 })
    .populate('userId', 'name email')
    .lean();
};

SystemLogSchema.statics.getErrorsByFingerprint = function(fingerprint: string) {
  return this.find({ fingerprint })
    .sort({ timestamp: -1 })
    .populate('userId', 'name email')
    .lean();
};

SystemLogSchema.statics.getLogsByUser = function(userId: string, limit = 100) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

SystemLogSchema.statics.getErrorStats = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        level: LogLevel.ERROR,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          category: '$category'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
};

SystemLogSchema.statics.getPerformanceStats = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        category: LogCategory.PERFORMANCE_ISSUE,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          action: '$action'
        },
        avgDuration: { $avg: '$duration' },
        maxDuration: { $max: '$duration' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
};

// Methods
SystemLogSchema.methods.markResolved = async function(
  userId: string, 
  notes?: string
) {
  this.resolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.resolutionNotes = notes;
  return this.save();
};

const SystemLog = mongoose.models?.SystemLog || mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);

export default SystemLog;