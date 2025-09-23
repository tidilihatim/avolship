'use server';

import { revalidatePath } from 'next/cache';
import Contact from '@/lib/db/models/contact';
import Warehouse from '@/lib/db/models/warehouse';
import { withDbConnection } from '@/lib/db/db-connect';
import { headers } from 'next/headers';
import { sendNotificationToUserType } from '@/lib/notifications/send-notification';
import { UserRole } from '@/lib/db/models/user';
import { NotificationType } from '@/types/notification';
import { NotificationIcon } from '@/lib/db/models/notification';

export interface ContactFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  country: string;
  message: string;
}

/**
 * Get all warehouse countries for public use (no auth required)
 * @returns List of countries where warehouses are available
 */
export const getWarehouseCountries = withDbConnection(async () => {
  try {
    const results = await Warehouse.aggregate([
      { $match: { isActive: true } }, // Only active warehouses
      { $group: { _id: "$country" } },
      { $sort: { _id: 1 } },
      { $project: { country: "$_id", _id: 0 } }
    ]);

    const countries = results.map(item => item.country);
    return { countries };
  } catch (error: any) {
    console.error('Error fetching warehouse countries:', error);
    return { countries: [], error: 'Failed to fetch countries' };
  }
});

/**
 * Get client device and location information
 */
async function getClientInfo() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const acceptLanguage = headersList.get('accept-language') || '';

  // Get IP address (prioritize x-forwarded-for, then x-real-ip)
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '';

  // Extract device information from user agent
  const deviceInfo = {
    userAgent,
    platform: getPlatformFromUserAgent(userAgent),
    language: acceptLanguage.split(',')[0] || 'en',
    timezone: '' // Will be set from client side if needed
  };

  // Get location from IP (you can integrate with IP geolocation service)
  const location = await getLocationFromIP(ipAddress);

  return {
    deviceInfo,
    ipAddress,
    location
  };
}

/**
 * Extract platform from user agent string
 */
function getPlatformFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown';
}

/**
 * Get location from IP address (mock implementation)
 * You can integrate with services like ipapi.co, ipgeolocation.io, etc.
 */
async function getLocationFromIP(ipAddress: string) {
  try {
    // Skip for local IPs
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
    }

    // You can integrate with a real IP geolocation service here
    // For now, returning a placeholder
    return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };

    // Example integration with ipapi.co (uncomment if you want to use it):
    /*
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: { 'User-Agent': 'AvolShip Contact Form' }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown'
      };
    }
    */
  } catch (error) {
    console.error('Error getting location from IP:', error);
  }

  return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
}

/**
 * Submit contact form
 * @param data - Contact form data
 * @returns Success message or error
 */
export const submitContactForm = withDbConnection(async (data: ContactFormData) => {
  try {
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phoneNumber', 'countryCode', 'country', 'message'];
    for (const field of requiredFields) {
      if (!data[field as keyof ContactFormData]?.trim()) {
        return { error: `${field} is required` };
      }
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      return { error: 'Please provide a valid email address' };
    }

    // Get client information
    const clientInfo = await getClientInfo();

    // Create contact record
    const contact: any = await Contact.create({
      ...data,
      ...clientInfo,
      status: 'new',
      priority: 'medium'
    });

    console.log('Contact form submitted:', {
      id: contact._id.toString(),
      email: contact.email,
      country: contact.country,
      ipAddress: contact.ipAddress
    });

    // Send notifications to admins and moderators about new contact submission
    sendNotificationToUserType(UserRole.ADMIN, {
      title: "New Contact Form Submission",
      message: `${data.fullName} has submitted a contact form. Email: ${data.email}`,
      type: NotificationType.INFO,
      icon: NotificationIcon.MESSAGE_CIRCLE,
      actionLink: `/dashboard/admin/contacts?contact_id=${contact._id}`,
      metadata: {
        contactId: contact._id.toString(),
        customerEmail: data.email,
        customerCountry: data.country
      }
    });

    sendNotificationToUserType(UserRole.MODERATOR, {
      title: "New Contact Form Submission",
      message: `${data.fullName} has submitted a contact form. Email: ${data.email}`,
      type: NotificationType.INFO,
      icon: NotificationIcon.MESSAGE_CIRCLE,
      actionLink: `/dashboard/moderator/contacts?contact_id=${contact._id}`,
      metadata: {
        contactId: contact._id.toString(),
        customerEmail: data.email,
        customerCountry: data.country
      }
    });

    return {
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      contactId: contact._id.toString()
    };
  } catch (error: any) {
    console.error('Error submitting contact form:', error);

    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return { error: validationErrors.join(', ') };
    }

    return { error: 'Failed to submit contact form. Please try again.' };
  }
});

/**
 * Get contact form statistics (for admin dashboard)
 * @returns Contact statistics
 */
export const getContactStats = withDbConnection(async () => {
  try {
    const stats = await Contact.getContactStats();
    return { stats };
  } catch (error: any) {
    console.error('Error getting contact stats:', error);
    return { error: 'Failed to get contact statistics' };
  }
});

/**
 * Get contact submissions with filtering and pagination (for admin)
 * @param params - Filter and pagination parameters
 * @returns Contact submissions
 */
export const getContactSubmissions = withDbConnection(async (params?: {
  status?: string;
  priority?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
  assignedTo?: string;
}) => {
  try {
    // Build query based on filters
    const query: any = {};

    if (params?.status) {
      query.status = params.status;
    }

    if (params?.priority) {
      query.priority = params.priority;
    }

    if (params?.country) {
      query.country = params.country;
    }

    if (params?.assignedTo) {
      query.assignedTo = params.assignedTo;
    }

    if (params?.search) {
      query.$or = [
        { fullName: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
        { message: { $regex: params.search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await Contact.countDocuments(query);

    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .populate('assignedTo', 'name email')
      .populate('adminNotes.createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      contacts: JSON.parse(JSON.stringify(contacts)),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error: any) {
    console.error('Error getting contact submissions:', error);
    return { error: 'Failed to get contact submissions' };
  }
});

/**
 * Update contact status
 * @param contactId - Contact ID
 * @param status - New status
 * @param assignedTo - User ID to assign to (optional)
 * @returns Updated contact
 */
export const updateContactStatus = withDbConnection(async (
  contactId: string,
  status: string,
  assignedTo?: string
) => {
  try {
    const updateData: any = { status };

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!contact) {
      return { error: 'Contact not found' };
    }

    revalidatePath('/admin/contacts');
    return { contact: JSON.parse(JSON.stringify(contact)) };
  } catch (error: any) {
    console.error('Error updating contact status:', error);
    return { error: 'Failed to update contact status' };
  }
});

/**
 * Add admin note to contact
 * @param contactId - Contact ID
 * @param note - Admin note
 * @param createdBy - User ID who created the note
 * @returns Updated contact
 */
export const addContactNote = withDbConnection(async (
  contactId: string,
  note: string,
  createdBy: string
) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      {
        $push: {
          adminNotes: {
            note,
            createdBy,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('adminNotes.createdBy', 'name email');

    if (!contact) {
      return { error: 'Contact not found' };
    }

    revalidatePath('/admin/contacts');
    return { contact: JSON.parse(JSON.stringify(contact)) };
  } catch (error: any) {
    console.error('Error adding contact note:', error);
    return { error: 'Failed to add note' };
  }
});