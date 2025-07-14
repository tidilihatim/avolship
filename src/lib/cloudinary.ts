// src/lib/utils/cloudinary.ts

/**
 * Cloudinary configuration
 */
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.warn('Cloudinary environment variables not properly configured');
}

/**
 * Upload a file to Cloudinary
 * @param file File to upload
 * @returns Object containing the secure URL and public ID
 */
export async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  try {
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId Cloudinary public ID
 * @returns True if deletion was successful
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    // Server-side only
    if (typeof window !== 'undefined') {
      console.error('This function can only be called from server-side code');
      return false;
    }
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Generate signature
    const crypto = require('crypto');
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');
    
    // Create form data
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    
    // Make API request
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Deletion failed: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Validate image file
 * @param file File to validate
 * @returns Object containing validation result and error message if any
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { 
      isValid: false, 
      error: 'Only image files are allowed (JPG, PNG, WEBP)' 
    };
  }
  
  // Check allowed formats
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Only JPG, PNG, and WEBP images are allowed' 
    };
  }
  
  // Check size (limit to 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: 'Image size must be less than 5MB' 
    };
  }
  
  return { isValid: true };
}

/**
 * Generate a Cloudinary URL with transformations
 * @param url Original Cloudinary URL
 * @param options Transformation options
 * @returns Transformed URL
 */
export function getTransformedUrl(
  url: string, 
  options: { 
    width?: number; 
    height?: number;
    crop?: 'fill' | 'scale' | 'fit' | 'thumb';
    quality?: number;
  }
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL, return as is
  }
  
  // Extract base URL and file path
  const [baseUrl, filePath] = url.split('/image/upload/');
  
  // Build transformation string
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  
  // If no transformations, return original URL
  if (transformations.length === 0) {
    return url;
  }
  
  // Construct new URL with transformations
  const transformationString = transformations.join(',') + '/';
  return `${baseUrl}/image/upload/${transformationString}${filePath}`;
}