/**
 * S3 Upload utility
 * Provides functions to upload files to S3 via API endpoint
 */

import { getAccessToken } from "@/app/actions/cookie";



const API_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

/**
 * Upload a single image to S3 via API endpoint
 * @param file - The image file to upload
 * @returns Promise containing the upload result with URL and publicId
 */
export const uploadImageToS3 = async (file: File): Promise<{url: string; publicId: string}> => {
  try {
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('image', file);

    const accessToken = await getAccessToken()
    if(!accessToken) throw new Error("Unauthorized")

    // Make API call to upload endpoint
    const response = await fetch(`${API_BASE_URL}/api/products/upload-image`, {
      headers:{
        "Authorization":`Bearer ${accessToken}`
      },
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Upload failed - no data returned');
    }

    return {
      url: result.data.url,
      publicId: result.data.publicId
    };
  } catch (error) {
    console.error('S3 upload error:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred during upload');
    }
  }
};

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Validation result with isValid flag and error message
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size allowed is 5MB.'
    };
  }

  return { isValid: true };
};