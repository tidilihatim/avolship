import { getAccessToken } from "@/app/actions/cookie";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

// Get auth headers for JSON
async function getAuthHeaders() {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Get auth headers for form data
async function getAuthHeadersFormData() {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    'Authorization': `Bearer ${token}`,
  };
}

export interface CreateTicketData {
  title: string;
  description: string;
  category: string;
  priority: string;
  relatedOrderId?: string;
  tags?: string[];
  files?: File[];
}

export class TicketAPI {
  // Create new ticket
  static async createTicket(data: CreateTicketData): Promise<{ success: boolean; ticket: any }> {
    const headers = await getAuthHeadersFormData();
    
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('priority', data.priority);
    
    if (data.relatedOrderId) {
      formData.append('relatedOrderId', data.relatedOrderId);
    }
    
    if (data.tags) {
      formData.append('tags', JSON.stringify(data.tags));
    }

    // Add files if any
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${SOCKET_URL}/api/tickets`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create ticket');
    }

    return response.json();
  }

  // Get ticket messages with pagination
  static async getTicketMessages(ticketId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    const headers = await getAuthHeaders();
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    const response = await fetch(`${SOCKET_URL}/api/tickets/${ticketId}/messages?${queryParams}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }

    return response.json();
  }

  // Add message to ticket
  static async addTicketMessage(
    ticketId: string, 
    message: string, 
    isInternal: boolean = false, 
    files?: File[]
  ): Promise<{ success: boolean; message: any }> {
    const headers = await getAuthHeadersFormData();
    
    const formData = new FormData();
    formData.append('message', message);
    formData.append('isInternal', isInternal.toString());

    // Add files if any
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${SOCKET_URL}/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add message');
    }

    return response.json();
  }

  // Mark messages as read
  static async markMessagesAsRead(ticketId: string, messageIds: string[]): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SOCKET_URL}/api/tickets/${ticketId}/messages/read`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messageIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark messages as read');
    }

    return response.json();
  }

  // Get presigned URL for ticket attachment
  static async getAttachmentDownloadUrl(ticketId: string, filename: string): Promise<{ success: boolean; data: { signedUrl: string; filename: string; fileType: string } }> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SOCKET_URL}/api/tickets/${ticketId}/attachment/${encodeURIComponent(filename)}/download`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to get download URL');
    }

    return response.json();
  }
}