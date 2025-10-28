export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  type: 'general' | 'bug' | 'feature' | 'improvement';
  message: string;
  rating?: number;
  contact_email?: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
}

export interface ContactOptions {
  live_chat: {
    available: boolean;
    hours: string;
    response_time: string;
  };
  phone: {
    available: boolean;
    number: string;
    hours: string;
    response_time: string;
  };
  email: {
    available: boolean;
    address: string;
    hours: string;
    response_time: string;
  };
  emergency: {
    available: boolean;
    number: string;
    hours: string;
    response_time: string;
  };
}

class HelpService {
  private baseUrl = '/api/help';

  // FAQ methods
  async getFAQ(category?: string, search?: string): Promise<FAQItem[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await fetch(`${this.baseUrl}/faq?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FAQ items');
      }

      const data = await response.json();
      return data.faqs || [];
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw error;
    }
  }

  // Feedback methods
  async submitFeedback(feedback: {
    type: 'general' | 'bug' | 'feature' | 'improvement';
    message: string;
    rating?: number;
    contact_email?: string;
  }): Promise<Feedback> {
    try {
      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const data = await response.json();
      return data.feedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Support ticket methods
  async getSupportTickets(): Promise<SupportTicket[]> {
    try {
      const response = await fetch(`${this.baseUrl}/support-tickets`);
      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }

      const data = await response.json();
      return data.tickets || [];
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      throw error;
    }
  }

  async createSupportTicket(ticket: {
    subject: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
  }): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        throw new Error('Failed to create support ticket');
      }

      const data = await response.json();
      return data.ticket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  // Contact options
  async getContactOptions(): Promise<ContactOptions> {
    try {
      const response = await fetch(`${this.baseUrl}/contact-options`);
      if (!response.ok) {
        throw new Error('Failed to fetch contact options');
      }

      const data = await response.json();
      return data.contactOptions;
    } catch (error) {
      console.error('Error fetching contact options:', error);
      throw error;
    }
  }

  // Notification methods
  async getNotifications(): Promise<UserNotification[]> {
    try {
      const response = await fetch('/api/users/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const response = await fetch('/api/users/notifications/read-all', {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

export const helpService = new HelpService();
