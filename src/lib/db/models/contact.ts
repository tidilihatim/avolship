import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Contact form submission interface
 */
export interface IContact extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  country: string;
  message: string;

  // Optional system information
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    language?: string;
    timezone?: string;
  };

  ipAddress?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };

  // Status tracking
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;

  // Admin notes
  adminNotes?: Array<{
    note: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

/**
 * Static methods interface
 */
export interface IContactModel extends Model<IContact> {
  getContactStats(): Promise<{
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byPriority: Record<string, number>;
  }>;
}

/**
 * Contact form schema
 */
const ContactSchema = new Schema<IContact, IContactModel>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name must be less than 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message must be less than 2000 characters']
    },

    // Optional system information
    deviceInfo: {
      userAgent: { type: String },
      platform: { type: String },
      language: { type: String },
      timezone: { type: String }
    },

    ipAddress: {
      type: String,
      trim: true
    },

    location: {
      country: { type: String },
      region: { type: String },
      city: { type: String }
    },

    // Status tracking
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new'
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    // Admin notes
    adminNotes: [{
      note: {
        type: String,
        required: true,
        trim: true
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],

    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ priority: 1 });
ContactSchema.index({ country: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ assignedTo: 1 });

// TTL index for automatic deletion after 50 days (50 * 24 * 60 * 60 = 4320000 seconds)
ContactSchema.index({ createdAt: 1 }, { expireAfterSeconds: 4320000 });

// Virtual for formatted phone number
ContactSchema.virtual('formattedPhone').get(function() {
  return `${this.countryCode} ${this.phoneNumber}`;
});

// Static method to get contact statistics
ContactSchema.statics.getContactStats = async function() {
  const pipeline = [
    {
      $facet: {
        statusStats: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        priorityStats: [
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        totalCount: [
          { $count: 'total' }
        ]
      }
    }
  ];

  const results = await this.aggregate(pipeline);
  const data = results[0];

  const statusCounts = data.statusStats.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const priorityCounts = data.priorityStats.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    total: data.totalCount[0]?.total || 0,
    new: statusCounts.new || 0,
    inProgress: statusCounts.in_progress || 0,
    resolved: statusCounts.resolved || 0,
    closed: statusCounts.closed || 0,
    byPriority: priorityCounts
  };
};

// Pre-save middleware to update resolvedAt
ContactSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'resolved' || this.status === 'closed')) {
    this.resolvedAt = new Date();
  }
  next();
});

// Create the model
const Contact = (mongoose.models?.Contact ||
  mongoose.model<IContact, IContactModel>('Contact', ContactSchema)) as IContactModel;

export default Contact;